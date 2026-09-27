from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.entities import (
    Call, CallTranscript, CallClassification, CallSummary, ActionItem,
    EmergencyEvent, Notification, ProfessionalProfile, Resume, User,
    SpeakerEnum, CallStatusEnum, CallCategoryEnum, UrgencyLevelEnum
)
from app.ai.base import ChatMessage, AIResponse
from app.ai.factory import get_ai_provider

class CallSessionService:
    """Coordinates call session intelligence, state transitions, and post-call reporting."""

    def __init__(self, db: Session, ai_provider_name: Optional[str] = None):
        self.db = db
        self.ai = get_ai_provider(ai_provider_name)

    async def process_caller_turn(
        self,
        call_id: int,
        message_text: str,
        simulation_type: Optional[str] = "Job Interview",
        first_person: bool = True,
        resume_text: Optional[str] = None
    ) -> AIResponse:
        """Processes caller utterance, generates grounded reply, and updates call state."""
        call = self.db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise ValueError(f"Call {call_id} not found")

        # 1. Save caller transcript
        started_at = call.started_at or datetime.utcnow()
        offset_ms = int((datetime.utcnow() - started_at).total_seconds() * 1000)
        caller_transcript = CallTranscript(
            call_id=call.id,
            speaker=SpeakerEnum.CALLER.value,
            text=message_text,
            timestamp_offset_ms=max(500, offset_ms),
            confidence=1.0
        )
        self.db.add(caller_transcript)
        self.db.flush()

        # 2. Build conversation history
        transcripts = (
            self.db.query(CallTranscript)
            .filter(CallTranscript.call_id == call.id)
            .order_by(CallTranscript.timestamp_offset_ms)
            .all()
        )
        chat_messages = [
            ChatMessage(
                role="assistant" if t.speaker == SpeakerEnum.ASSISTANT.value else "user",
                content=t.text
            )
            for t in transcripts
        ]

        # 3. Retrieve professional profile and resume
        prof_profile = (
            self.db.query(ProfessionalProfile)
            .filter(ProfessionalProfile.user_id == call.user_id, ProfessionalProfile.is_active == True)
            .first()
        )
        resume = (
            self.db.query(Resume)
            .filter(Resume.user_id == call.user_id, Resume.raw_text != "")
            .order_by(Resume.created_at.desc())
            .first()
        )

        profile_dict = None
        active_resume_text = (resume_text or "").strip() or ((resume.sanitized_text or resume.raw_text) if resume else "")
        active_raw_resume = (resume_text or "").strip() or (resume.raw_text if resume else "")

        # Fallback: if no text found, reconstruct from prof_profile
        if not active_resume_text and prof_profile:
            parts = []
            if prof_profile.summary:
                parts.append(f"SUMMARY\n{prof_profile.summary}")
            if prof_profile.skills:
                skills_str = ", ".join(prof_profile.skills) if isinstance(prof_profile.skills, list) else str(prof_profile.skills)
                parts.append(f"SKILLS\n{skills_str}")
            if prof_profile.work_experience and isinstance(prof_profile.work_experience, list):
                exp_strs = []
                for exp in prof_profile.work_experience:
                    exp_strs.append(f"{exp.get('role', '')} at {exp.get('company', '')} ({exp.get('dates', '')})")
                    for h in exp.get("highlights", []):
                        exp_strs.append(f"• {h}")
                parts.append("EXPERIENCE\n" + "\n".join(exp_strs))
            active_resume_text = "\n\n".join(parts)
            active_raw_resume = active_resume_text

        if prof_profile or resume or active_resume_text:
            profile_dict = {
                "summary": prof_profile.summary if prof_profile else "",
                "skills": prof_profile.skills if prof_profile else [],
                "work_experience": prof_profile.work_experience if prof_profile else [],
                "education": prof_profile.education if prof_profile else [],
                "projects": prof_profile.projects if prof_profile else [],
                "internships": prof_profile.internships if prof_profile else [],
                "certifications": prof_profile.certifications if prof_profile else [],
                "achievements": prof_profile.achievements if prof_profile else [],
                "resume_text": active_resume_text,
                "raw_resume": active_raw_resume
            }

        user = self.db.query(User).filter(User.id == call.user_id).first()
        call_context = {
            "user_name": user.full_name if user else "Arjun Sharma",
            "category": call.category,
            "caller_name": call.caller_name,
            "caller_number": call.caller_number,
            "simulation_type": simulation_type or "Job Interview",
            "first_person": first_person
        }

        # 4. Generate AI response
        ai_resp = await self.ai.generate_response(
            messages=chat_messages,
            call_context=call_context,
            professional_profile=profile_dict
        )

        # 5. Save assistant response transcript
        assistant_offset_ms = offset_ms + 1500
        assistant_transcript = CallTranscript(
            call_id=call.id,
            speaker=SpeakerEnum.ASSISTANT.value,
            text=ai_resp.reply_text,
            timestamp_offset_ms=assistant_offset_ms,
            confidence=1.0
        )
        self.db.add(assistant_transcript)

        # 6. Check emergency trigger
        if ai_resp.is_emergency:
            call.urgency = UrgencyLevelEnum.POTENTIAL_EMERGENCY.value
            call.category = CallCategoryEnum.EMERGENCY.value
            
            existing_event = self.db.query(EmergencyEvent).filter(EmergencyEvent.call_id == call.id).first()
            if not existing_event:
                emergency_event = EmergencyEvent(
                    call_id=call.id,
                    severity=UrgencyLevelEnum.POTENTIAL_EMERGENCY.value,
                    trigger_reason=f"Emergency trigger in call with {call.caller_name}: {message_text[:120]}...",
                    caller_claimed_emergency=True,
                    is_dismissed=False
                )
                self.db.add(emergency_event)

                # High priority notification
                self.db.add(Notification(
                    user_id=call.user_id,
                    call_id=call.id,
                    title=f"CRITICAL EMERGENCY: {call.caller_name}",
                    message=f"AURA detected an urgent medical or crisis call from {call.caller_name}. Requires immediate PIN review.",
                    level="EMERGENCY",
                    is_read=False
                ))

        self.db.commit()
        return ai_resp

    async def finalize_call(self, call_id: int) -> Call:
        """Concludes call session, runs classification & summarization, and generates action items."""
        call = self.db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise ValueError(f"Call {call_id} not found")

        call.ended_at = datetime.utcnow()
        call.status = CallStatusEnum.COMPLETED.value
        started_at = call.started_at or call.ended_at
        call.duration_seconds = max(15, int((call.ended_at - started_at).total_seconds()))

        transcripts = (
            self.db.query(CallTranscript)
            .filter(CallTranscript.call_id == call.id)
            .order_by(CallTranscript.timestamp_offset_ms)
            .all()
        )
        transcript_dicts = [{"speaker": t.speaker, "text": t.text} for t in transcripts]

        # Classify
        classification = await self.ai.classify_call(
            transcripts=transcript_dicts,
            caller_info={"caller_name": call.caller_name, "caller_number": call.caller_number}
        )
        call.category = classification.primary_category.value
        call.urgency = classification.urgency.value

        existing_class = self.db.query(CallClassification).filter(CallClassification.call_id == call.id).first()
        if not existing_class:
            self.db.add(CallClassification(
                call_id=call.id,
                primary_category=classification.primary_category.value,
                confidence=classification.confidence,
                secondary_categories=classification.secondary_categories,
                reasoning=classification.reasoning
            ))

        # Summarize & Extract Action Items
        summary = await self.ai.summarize_call(
            transcripts=transcript_dicts,
            call_metadata={"caller_name": call.caller_name, "category": call.category}
        )

        existing_summary = self.db.query(CallSummary).filter(CallSummary.call_id == call.id).first()
        if not existing_summary:
            self.db.add(CallSummary(
                call_id=call.id,
                overview=summary.overview,
                key_decisions=summary.key_decisions,
                questions_asked=summary.questions_asked,
                questions_answered=getattr(summary, 'questions_answered', []),
                questions_private=getattr(summary, 'questions_private', []),
                questions_unrelated=getattr(summary, 'questions_unrelated', []),
                questions_uncertain=getattr(summary, 'questions_uncertain', []),
                follow_ups=summary.follow_ups,
                ai_confidence=summary.ai_confidence
            ))

        user = self.db.query(User).filter(User.id == call.user_id).first()
        user_name = user.full_name if user else "Arjun Sharma"

        for ai in summary.action_items:
            self.db.add(ActionItem(
                call_id=call.id,
                task=ai["task"],
                assignee=ai.get("assignee", user_name),
                priority=ai.get("priority", "Medium"),
                is_completed=False
            ))

        self.db.commit()
        self.db.refresh(call)
        return call
