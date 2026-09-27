from typing import List, Optional
from datetime import datetime
import traceback
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.entities import (
    User, UserProfile, SecuritySettings, ProfessionalProfile, Resume,
    Call, CallTranscript, CallClassification, CallSummary,
    ActionItem, EmergencyEvent, DailyReport, Notification,
    CallCategoryEnum, UrgencyLevelEnum, CallStatusEnum, SpeakerEnum
)
from app.schemas.domain import (
    UserRead, UserProfileRead, UserProfileBase, SecuritySettingsRead, SecurityPinUpdate,
    CallRead, CallSimulateRequest, CallSimulateResponse,
    ProfessionalProfileRead, ProfessionalProfileCreate,
    ResumeSaveRequest, ResumeRead,
    EmergencyEventRead, EmergencyDismissRequest,
    DailyReportRead, ActionItemRead, ActionItemUpdate, NotificationRead
)

router = APIRouter()

# --- Healthcheck ---
@router.get("/health", tags=["System"])
def healthcheck():
    return {
        "status": "healthy",
        "service": "AURA API",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# --- User & Profile ---
@router.get("/user/me", response_model=UserRead, tags=["User"])
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not initialized")
    return user

@router.put("/user/profile", response_model=UserProfileRead, tags=["User"])
def update_user_profile(profile_in: UserProfileBase, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(user.profile, field, value)
    
    db.commit()
    db.refresh(user.profile)
    return user.profile

@router.put("/user/security/pin", tags=["Security"])
def update_security_pin(pin_data: SecurityPinUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user or not user.security_settings:
        raise HTTPException(status_code=404, detail="Security settings not found")
    
    if user.security_settings.emergency_pin_hash != pin_data.current_pin:
        raise HTTPException(status_code=400, detail="Current PIN is incorrect")
    
    user.security_settings.emergency_pin_hash = pin_data.new_pin
    db.commit()
    return {"message": "Emergency PIN updated successfully"}

# --- Calls ---
@router.get("/calls", response_model=List[CallRead], tags=["Calls"])
def list_calls(
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Call).order_by(desc(Call.started_at))
    if category:
        query = query.filter(Call.category == category)
    if urgency:
        query = query.filter(Call.urgency == urgency)
    if search:
        query = query.filter(
            (Call.caller_name.ilike(f"%{search}%")) |
            (Call.caller_number.ilike(f"%{search}%"))
        )
    return query.limit(limit).all()

@router.get("/calls/{call_id}", response_model=CallRead, tags=["Calls"])
def get_call_detail(call_id: int, db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail=f"Call {call_id} not found")
    return call

@router.post("/calls/simulate", response_model=CallSimulateResponse, tags=["Calls"])
def simulate_incoming_call(sim_req: CallSimulateRequest, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=500, detail="Default user not seeded")
    
    # Check if candidate name is available from latest resume
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id, Resume.raw_text != "")
        .order_by(desc(Resume.created_at))
        .first()
    )
    candidate_name = user.full_name or "Alex Chen"
    if latest_resume and latest_resume.raw_text:
        lines = [l.strip() for l in latest_resume.raw_text.splitlines() if l.strip()]
        if lines:
            first_l = lines[0].replace("#", "").strip().split("|")[0].strip()
            if 2 < len(first_l) < 40 and not any(k in first_l.lower() for k in ["resume", "summary", "profile", "contact", "developer", "engineer"]):
                candidate_name = first_l

    first_name = candidate_name.split()[0] if candidate_name else "Alex"

    if sim_req.first_person:
        if sim_req.opening_line:
            greeting = sim_req.opening_line
        elif sim_req.scenario == CallCategoryEnum.INTERVIEW or any(term in sim_req.simulation_type.lower() for term in ["interview", "screening", "recruiter"]):
            greeting = f"Hi {first_name}, thank you for joining our interview today. I'm {sim_req.caller_name}. Could you walk me through your background and your experience building distributed real-time systems?"
        elif "Customer" in sim_req.simulation_type:
            greeting = f"Hello, this is {first_name} speaking! Thank you for reaching out to us. How can I assist you today?"
        elif "Networking" in sim_req.simulation_type:
            greeting = f"Hello, this is {first_name} speaking! Wonderful to connect with you. What are you working on lately?"
        elif "Personal" in sim_req.simulation_type:
            greeting = f"Hey, this is {first_name}! Great to hear from you. How can I help you today?"
        else:
            greeting = f"Hello, this is {first_name} speaking. How can I help you today?"
    else:
        greeting = (
            f"Hello, I'm AURA, an AI representative assisting on behalf of {candidate_name}. "
            f"How can I help you regarding their qualifications, projects, or background today?"
        )

    new_call = Call(
        user_id=user.id,
        caller_name=sim_req.caller_name,
        caller_number=sim_req.caller_number,
        category=sim_req.scenario.value,
        urgency=UrgencyLevelEnum.NORMAL.value if sim_req.scenario != CallCategoryEnum.EMERGENCY else UrgencyLevelEnum.POTENTIAL_EMERGENCY.value,
        status=CallStatusEnum.IN_PROGRESS.value,
        is_video=sim_req.is_video,
        started_at=datetime.utcnow()
    )
    db.add(new_call)
    db.flush()

    # Add initial greeting transcript
    db.add(CallTranscript(
        call_id=new_call.id,
        speaker=SpeakerEnum.ASSISTANT.value,
        text=greeting,
        timestamp_offset_ms=500
    ))
    db.commit()
    db.refresh(new_call)

    return CallSimulateResponse(
        call_id=new_call.id,
        caller_name=new_call.caller_name,
        caller_number=new_call.caller_number,
        status=CallStatusEnum.IN_PROGRESS,
        greeting=greeting,
        category_hint=sim_req.scenario,
        simulation_type=sim_req.simulation_type,
        first_person=sim_req.first_person
    )

# --- Call Interaction & Finalization ---
from app.services.session_service import CallSessionService
from app.schemas.domain import AIInteractionRequest, AIInteractionResponse

@router.post("/calls/{call_id}/interact", response_model=AIInteractionResponse, tags=["Calls"])
async def interact_in_call(
    call_id: int,
    req: AIInteractionRequest,
    db: Session = Depends(get_db)
):
    session_service = CallSessionService(db)
    try:
        resp = await session_service.process_caller_turn(
            call_id=call_id,
            message_text=req.caller_message,
            simulation_type=req.simulation_type,
            first_person=req.first_person,
            resume_text=req.resume_text
        )
        return AIInteractionResponse(
            call_id=call_id,
            assistant_reply=resp.reply_text,
            detected_intent=resp.detected_intent,
            detected_urgency=resp.detected_urgency,
            is_emergency=resp.is_emergency,
            requires_user_alert=resp.requires_user_alert,
            interview_grounded=resp.interview_grounded,
            classification_type=getattr(resp, 'classification_type', 'ANSWERED'),
            confidence_level=getattr(resp, 'confidence_level', 'HIGH'),
            topic=getattr(resp, 'topic', None)
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI interaction failed: {str(e)}")

@router.post("/calls/{call_id}/finalize", response_model=CallRead, tags=["Calls"])
async def finalize_call(
    call_id: int,
    db: Session = Depends(get_db)
):
    session_service = CallSessionService(db)
    try:
        updated_call = await session_service.finalize_call(call_id)
        return updated_call
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Call finalization failed: {str(e)}")

# --- Professional Profile ---
@router.get("/profile/professional", response_model=Optional[ProfessionalProfileRead], tags=["Profile"])
def get_professional_profile(db: Session = Depends(get_db)):
    prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.is_active == True).first()
    return prof

@router.put("/profile/professional", response_model=ProfessionalProfileRead, tags=["Profile"])
def update_professional_profile(prof_in: ProfessionalProfileCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == user.id).first()
    if not prof:
        prof = ProfessionalProfile(user_id=user.id, **prof_in.model_dump())
        db.add(prof)
    else:
        for field, val in prof_in.model_dump().items():
            setattr(prof, field, val)
    db.commit()
    db.refresh(prof)
    return prof

@router.get("/profile/resume", response_model=Optional[ResumeRead], tags=["Profile"])
def get_latest_resume(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        return None
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(desc(Resume.created_at))
        .first()
    )
    return resume

@router.post("/profile/resume", response_model=ResumeRead, tags=["Profile"])
def save_user_resume(resume_in: ResumeSaveRequest, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="Default user not initialized")

    # Guard: raw_text must not be null/empty — Resume.raw_text is NOT NULL in DB
    raw_text_value = resume_in.raw_text or ""

    # If resume contains a candidate name on the first line, sync user.full_name
    if raw_text_value:
        lines = [l.strip() for l in raw_text_value.splitlines() if l.strip()]
        if lines:
            first_l = lines[0].replace("#", "").strip().split("|")[0].strip()
            if 2 < len(first_l) < 40 and not any(k in first_l.lower() for k in ["resume", "summary", "profile", "contact", "developer", "engineer"]):
                user.full_name = first_l
                db.add(user)

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(desc(Resume.created_at))
        .first()
    )
    if not resume:
        resume = Resume(
            user_id=user.id,
            filename=resume_in.filename or "resume.txt",
            raw_text=raw_text_value,
            sanitized_text=resume_in.sanitized_text,
            pii_detected=resume_in.pii_detected or {}
        )
        db.add(resume)
    else:
        resume.filename = resume_in.filename or resume.filename
        resume.raw_text = raw_text_value
        if resume_in.sanitized_text is not None:
            resume.sanitized_text = resume_in.sanitized_text
        if resume_in.pii_detected is not None:
            resume.pii_detected = resume_in.pii_detected

    # Synchronize ProfessionalProfile with newly saved resume
    prof_profile = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == user.id).first()
    if prof_profile and raw_text_value:
        import re
        lines = [l.strip() for l in raw_text_value.splitlines() if l.strip()]
        for l in lines:
            if "SKILLS" in l.upper():
                parts = l.replace("SKILLS", "").replace(":", "").strip()
                extracted = [s.strip() for s in re.split(r'[,•|/;\n]+', parts) if len(s.strip()) > 1]
                if extracted:
                    prof_profile.skills = extracted
                    break
        db.add(prof_profile)

    db.commit()
    db.refresh(resume)
    return resume

# --- Emergency Center ---
@router.get("/emergency/events", response_model=List[EmergencyEventRead], tags=["Emergency"])
def list_emergency_events(active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(EmergencyEvent).order_by(desc(EmergencyEvent.created_at))
    if active_only:
        query = query.filter(EmergencyEvent.is_dismissed == False)
    return query.all()

@router.post("/emergency/dismiss", tags=["Emergency"])
def dismiss_emergency(req: EmergencyDismissRequest, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user or not user.security_settings:
        raise HTTPException(status_code=500, detail="Security settings missing")
    
    if req.pin != user.security_settings.emergency_pin_hash:
        raise HTTPException(status_code=403, detail="Invalid Emergency Dismissal PIN")
    
    event = db.query(EmergencyEvent).filter(EmergencyEvent.id == req.emergency_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Emergency event not found")
    
    event.is_dismissed = True
    event.dismissed_at = datetime.utcnow()
    event.dismissed_by = req.dismissed_by
    db.commit()
    return {"message": "Emergency alert successfully dismissed", "event_id": event.id}

# --- Action Items ---
@router.get("/action-items", response_model=List[ActionItemRead], tags=["Action Items"])
def list_action_items(db: Session = Depends(get_db)):
    return db.query(ActionItem).order_by(desc(ActionItem.created_at)).all()

@router.patch("/action-items/{item_id}", response_model=ActionItemRead, tags=["Action Items"])
def update_action_item(item_id: int, item_update: ActionItemUpdate, db: Session = Depends(get_db)):
    item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    
    if item_update.is_completed is not None:
        item.is_completed = item_update.is_completed
    if item_update.task is not None:
        item.task = item_update.task
    if item_update.priority is not None:
        item.priority = item_update.priority
    
    db.commit()
    db.refresh(item)
    return item

# --- Daily Reports ---
@router.get("/reports/daily", response_model=List[DailyReportRead], tags=["Reports"])
def list_daily_reports(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(DailyReport).order_by(desc(DailyReport.created_at)).limit(limit).all()

# --- Notifications ---
@router.get("/notifications", response_model=List[NotificationRead], tags=["Notifications"])
def list_notifications(unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Notification).order_by(desc(Notification.created_at))
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.all()

@router.post("/notifications/{notif_id}/read", tags=["Notifications"])
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}
