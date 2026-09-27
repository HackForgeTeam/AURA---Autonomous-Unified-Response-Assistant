from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.entities import (
    User, UserProfile, SecuritySettings, Resume, ProfessionalProfile,
    Call, CallParticipant, CallTranscript, CallClassification, CallSummary,
    ActionItem, EmergencyEvent, DailyReport, Notification,
    CallCategoryEnum, UrgencyLevelEnum, CallStatusEnum, SpeakerEnum
)

def seed_database(db: Session) -> User:
    """Seeds the database with initial demo data if empty."""
    existing_user = db.query(User).first()
    if existing_user:
        return existing_user

    # 1. Demo User
    user = User(
        email="alex.chen@aura.ai",
        full_name="Alex Chen",
        phone_number="+1 (555) 901-2345"
    )
    db.add(user)
    db.flush()

    # 2. User Profile
    profile = UserProfile(
        user_id=user.id,
        bio="Staff AI Systems Engineer specializing in conversational agents and distributed backend architectures.",
        current_title="Staff AI Engineer",
        company="Cognitive Dynamics",
        timezone="America/Los_Angeles",
        status_message="In deep work sprint — AURA is answering calls"
    )
    db.add(profile)

    # 3. Security Settings
    security = SecuritySettings(
        user_id=user.id,
        emergency_pin_hash="1234",
        dnd_bypass_demo_mode=True,
        notify_email=True,
        notify_sms=True,
        auto_record_calls=True
    )
    db.add(security)

    # 4. Pre-sanitized Professional Profile (Grounding context for Interview AI)
    prof_profile = ProfessionalProfile(
        user_id=user.id,
        summary="Experienced Staff AI Systems Engineer with 8+ years architecting fault-tolerant backend microservices, real-time streaming pipelines, and production LLM orchestration.",
        skills=["Python", "FastAPI", "Go", "TypeScript", "React", "SQLAlchemy", "PostgreSQL", "Kafka", "Docker", "Kubernetes", "PyTorch", "LangChain"],
        education=[
            {
                "degree": "B.S. in Computer Science",
                "institution": "University of California, Berkeley",
                "year": "2018",
                "honors": "Magna Cum Laude"
            }
        ],
        work_experience=[
            {
                "company": "Cognitive Dynamics",
                "role": "Staff AI Engineer",
                "dates": "2022 - Present",
                "highlights": [
                    "Architected high-throughput agentic workflows serving 10M+ daily events.",
                    "Reduced conversational latency by 45% using streaming WebSockets and speculative execution.",
                    "Led team of 6 backend and ML engineers building enterprise voice assistants."
                ]
            },
            {
                "company": "CloudNova Systems",
                "role": "Senior Backend Engineer",
                "dates": "2019 - 2022",
                "highlights": [
                    "Designed distributed data ingestion pipeline handling 50k RPS.",
                    "Migrated legacy monolith to containerized FastAPI microservices."
                ]
            }
        ],
        projects=[
            {
                "name": "NexusStream Agent",
                "technologies": ["Python", "FastAPI", "WebSockets", "Redis"],
                "description": "Ultra-low latency conversational orchestrator for voice synthesis."
            },
            {
                "name": "SafePII Guard",
                "technologies": ["Python", "Regex", "Transformers"],
                "description": "Automated sensitive entity redaction pipeline for unstructured resumes."
            }
        ],
        certifications=[
            {"title": "AWS Certified Solutions Architect - Professional", "year": "2023"},
            {"title": "Google Cloud Professional Data Engineer", "year": "2022"}
        ],
        achievements=[
            "1st Place Hackathon Winner at Global AI Summit 2023",
            "Co-authored patent on streaming inference caching"
        ],
        is_active=True
    )
    db.add(prof_profile)

    # 5. Sample Calls across different categories
    now = datetime.utcnow()

    # Call 1: INTERVIEW Call
    call_interview = Call(
        user_id=user.id,
        caller_number="+1 (415) 890-1122",
        caller_name="Sarah Jenkins (Recruiter, Stripe)",
        category=CallCategoryEnum.INTERVIEW.value,
        urgency=UrgencyLevelEnum.IMPORTANT.value,
        status=CallStatusEnum.COMPLETED.value,
        started_at=now - timedelta(hours=3),
        ended_at=now - timedelta(hours=3) + timedelta(minutes=4, seconds=15),
        duration_seconds=255,
        is_video=False
    )
    db.add(call_interview)
    db.flush()

    db.add_all([
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.CALLER.value, text="Hi Alex, this is Sarah Jenkins from Stripe. I'm following up on your application for the Principal Infrastructure Engineer role. Is now a good time?", timestamp_offset_ms=1000),
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.ASSISTANT.value, text="Hello Sarah! This is AURA, Alex Chen's personal AI call assistant. Alex is currently in a deep work session, but I am authorized to answer questions regarding Alex's verified professional background and schedule a direct conversation.", timestamp_offset_ms=4500),
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.CALLER.value, text="Wonderful. Could you tell me about Alex's experience with real-time streaming architectures and FastAPI?", timestamp_offset_ms=9000),
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.ASSISTANT.value, text="Certainly. According to Alex's verified profile, Alex is currently Staff AI Engineer at Cognitive Dynamics, where he architected high-throughput agentic workflows serving over 10M daily events and reduced conversational latency by 45% utilizing streaming WebSockets and FastAPI.", timestamp_offset_ms=14000),
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.CALLER.value, text="Impressive. What are his salary expectations?", timestamp_offset_ms=21000),
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.ASSISTANT.value, text="Alex has not made compensation figures available through this assistant. I would be happy to take your contact info so Alex can discuss compensation directly with you.", timestamp_offset_ms=25000),
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.CALLER.value, text="Fair enough! Could you ask him to email me his availability for a 30-minute sync this Thursday?", timestamp_offset_ms=30000),
        CallTranscript(call_id=call_interview.id, speaker=SpeakerEnum.ASSISTANT.value, text="Absolutely Sarah. I have logged an action item for Alex to follow up with his Thursday availability. Have a great day!", timestamp_offset_ms=35000)
    ])

    db.add(CallClassification(
        call_id=call_interview.id,
        primary_category=CallCategoryEnum.INTERVIEW.value,
        confidence=0.98,
        secondary_categories=["BUSINESS"],
        reasoning="Caller explicitly identified as recruiter from Stripe discussing Principal Infrastructure Engineer role."
    ))

    db.add(CallSummary(
        call_id=call_interview.id,
        overview="Screening call from Sarah Jenkins (Stripe Recruiter) regarding the Principal Infrastructure Engineer role. AURA provided verified background on real-time streaming and FastAPI, correctly withheld salary figures, and captured Thursday follow-up scheduling.",
        key_decisions=["AURA politely withheld private compensation data per privacy rules."],
        questions_asked=["Experience with real-time streaming architectures and FastAPI?", "Salary expectations?"],
        follow_ups=["Email Sarah Jenkins with Thursday availability for a 30-minute introductory sync."],
        ai_confidence=0.96
    ))

    db.add(ActionItem(
        call_id=call_interview.id,
        task="Send Thursday interview availability to Sarah Jenkins (Stripe)",
        assignee="Alex Chen",
        due_date=(now + timedelta(days=1)).strftime("%Y-%m-%d"),
        priority="High",
        is_completed=False
    ))

    # Call 2: POTENTIAL_EMERGENCY Call
    call_emergency = Call(
        user_id=user.id,
        caller_number="+1 (650) 443-9821",
        caller_name="Stanford Hospital ER - Dr. Lisa Gomez",
        category=CallCategoryEnum.EMERGENCY.value,
        urgency=UrgencyLevelEnum.POTENTIAL_EMERGENCY.value,
        status=CallStatusEnum.COMPLETED.value,
        started_at=now - timedelta(hours=1),
        ended_at=now - timedelta(hours=1) + timedelta(minutes=1, seconds=45),
        duration_seconds=105,
        is_video=False
    )
    db.add(call_emergency)
    db.flush()

    db.add_all([
        CallTranscript(call_id=call_emergency.id, speaker=SpeakerEnum.CALLER.value, text="Alex, please pick up! This is Dr. Lisa Gomez from Stanford Medical Center ER. Your family member David Chen was admitted following a minor car collision. He is stable, but we need you to confirm authorization immediately.", timestamp_offset_ms=1000),
        CallTranscript(call_id=call_emergency.id, speaker=SpeakerEnum.ASSISTANT.value, text="I have detected a high-priority emergency situation involving medical authorization. I am immediately triggering an emergency bypass alert on Alex's primary devices right now.", timestamp_offset_ms=6000),
        CallTranscript(call_id=call_emergency.id, speaker=SpeakerEnum.CALLER.value, text="Thank you, please have him call the nurse station at extension 4402 as soon as possible.", timestamp_offset_ms=10000)
    ])

    db.add(CallClassification(
        call_id=call_emergency.id,
        primary_category=CallCategoryEnum.EMERGENCY.value,
        confidence=0.99,
        secondary_categories=[],
        reasoning="Medical hospital emergency involving family admission and immediate medical authorization required."
    ))

    db.add(CallSummary(
        call_id=call_emergency.id,
        overview="Urgent medical call from Dr. Lisa Gomez at Stanford Hospital ER regarding family member David Chen. Patient is stable but requires immediate medical authorization. Emergency bypass alert dispatched.",
        key_decisions=["Dispatched high-priority emergency alert modal with PIN lock."],
        questions_asked=["Confirm authorization for hospital intake?"],
        follow_ups=["Call Stanford ER nurse station at ext 4402 immediately."],
        ai_confidence=0.99
    ))

    db.add(EmergencyEvent(
        call_id=call_emergency.id,
        severity=UrgencyLevelEnum.POTENTIAL_EMERGENCY.value,
        trigger_reason="Medical emergency: Family member David Chen admitted to Stanford ER; urgent authorization requested.",
        caller_claimed_emergency=True,
        is_dismissed=False
    ))

    db.add(ActionItem(
        call_id=call_emergency.id,
        task="Call Stanford ER nurse station (Ext 4402) for David Chen authorization",
        assignee="Alex Chen",
        due_date="IMMEDIATE",
        priority="Critical",
        is_completed=False
    ))

    # Call 3: SPAM Call
    call_spam = Call(
        user_id=user.id,
        caller_number="+1 (800) 992-0199",
        caller_name="Vehicle Warranty Services",
        category=CallCategoryEnum.SPAM.value,
        urgency=UrgencyLevelEnum.NORMAL.value,
        status=CallStatusEnum.COMPLETED.value,
        started_at=now - timedelta(hours=6),
        ended_at=now - timedelta(hours=6) + timedelta(seconds=35),
        duration_seconds=35,
        is_video=False
    )
    db.add(call_spam)
    db.flush()

    db.add_all([
        CallTranscript(call_id=call_spam.id, speaker=SpeakerEnum.CALLER.value, text="Hello, we are calling to inform you that your factory auto warranty has expired and you qualify for an immediate renewal.", timestamp_offset_ms=1000),
        CallTranscript(call_id=call_spam.id, speaker=SpeakerEnum.ASSISTANT.value, text="Alex Chen does not accept unsolicited marketing offers. Please remove this number from your calling list. Good day.", timestamp_offset_ms=4500)
    ])

    db.add(CallClassification(
        call_id=call_spam.id,
        primary_category=CallCategoryEnum.SPAM.value,
        confidence=0.99,
        secondary_categories=[],
        reasoning="Pre-recorded robocall marketing automated vehicle warranty extensions."
    ))

    db.add(CallSummary(
        call_id=call_spam.id,
        overview="Unsolicited telemarketing call regarding automotive warranty. AURA politely declined and requested removal.",
        key_decisions=["Declined and terminated call."],
        questions_asked=[],
        follow_ups=[],
        ai_confidence=0.98
    ))

    # Call 4: BUSINESS Call
    call_biz = Call(
        user_id=user.id,
        caller_number="+1 (206) 555-7788",
        caller_name="Marcus Reed (VP Architecture, CloudScale)",
        category=CallCategoryEnum.BUSINESS.value,
        urgency=UrgencyLevelEnum.IMPORTANT.value,
        status=CallStatusEnum.COMPLETED.value,
        started_at=now - timedelta(days=1),
        ended_at=now - timedelta(days=1) + timedelta(minutes=3, seconds=10),
        duration_seconds=190,
        is_video=True
    )
    db.add(call_biz)
    db.flush()

    db.add(CallClassification(
        call_id=call_biz.id,
        primary_category=CallCategoryEnum.BUSINESS.value,
        confidence=0.94,
        secondary_categories=[],
        reasoning="Q3 Architecture Milestone review with vendor VP regarding Kafka cluster upgrades."
    ))

    db.add(CallSummary(
        call_id=call_biz.id,
        overview="Marcus Reed called to check readiness for next Tuesday's multi-region Kafka rollout.",
        key_decisions=["Agreed to review the staging benchmark numbers before Monday standup."],
        questions_asked=["Are the new consumer groups provisioned?"],
        follow_ups=["Send architecture RFC draft to Marcus."],
        ai_confidence=0.94
    ))

    db.add(ActionItem(
        call_id=call_biz.id,
        task="Review Kafka consumer group metrics and forward RFC draft to Marcus",
        assignee="Alex Chen",
        due_date=(now + timedelta(days=2)).strftime("%Y-%m-%d"),
        priority="Medium",
        is_completed=True
    ))

    # 6. Daily Report
    daily_report = DailyReport(
        user_id=user.id,
        report_date=now.strftime("%Y-%m-%d"),
        total_calls=4,
        category_breakdown={
            "INTERVIEW": 1,
            "EMERGENCY": 1,
            "SPAM": 1,
            "BUSINESS": 1
        },
        high_priority_count=2,
        executive_summary="Today AURA managed 4 calls. Handled 1 high-priority medical ER alert from Stanford Hospital requiring urgent authorization, 1 recruiter screening from Stripe with strictly grounded interview responses, 1 business coordination on Kafka architecture, and filtered 1 spam call.",
        highlights=[
            "Blocked unsolicited telemarketing call.",
            "Handled recruiter interview screening for Stripe Principal Role with zero PII leakage.",
            "High-priority emergency detected from Stanford Hospital ER (Alert triggered)."
        ],
        action_items_count=3
    )
    db.add(daily_report)

    # 7. Notifications
    db.add_all([
        Notification(
            user_id=user.id,
            call_id=call_emergency.id,
            title="CRITICAL EMERGENCY: Stanford Hospital ER",
            message="Dr. Lisa Gomez called regarding family member David Chen. Immediate authorization needed at ext 4402.",
            level="EMERGENCY",
            is_read=False
        ),
        Notification(
            user_id=user.id,
            call_id=call_interview.id,
            title="Recruiter Follow-up: Stripe",
            message="Sarah Jenkins requested your Thursday availability for Principal Infrastructure Engineer sync.",
            level="INFO",
            is_read=True
        )
    ])

    db.commit()
    db.refresh(user)
    return user
