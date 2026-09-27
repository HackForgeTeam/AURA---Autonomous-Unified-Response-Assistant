from datetime import datetime
from typing import List, Optional
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class CallCategoryEnum(str, enum.Enum):
    NORMAL = "NORMAL"
    INTERVIEW = "INTERVIEW"
    BUSINESS = "BUSINESS"
    PERSONAL = "PERSONAL"
    SPAM = "SPAM"
    EMERGENCY = "EMERGENCY"
    UNKNOWN = "UNKNOWN"

class UrgencyLevelEnum(str, enum.Enum):
    NORMAL = "NORMAL"
    LOW_PRIORITY = "LOW_PRIORITY"
    IMPORTANT = "IMPORTANT"
    URGENT = "URGENT"
    POTENTIAL_EMERGENCY = "POTENTIAL_EMERGENCY"

class CallStatusEnum(str, enum.Enum):
    RINGING = "RINGING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DECLINED = "DECLINED"
    MISSED = "MISSED"

class SpeakerEnum(str, enum.Enum):
    CALLER = "CALLER"
    ASSISTANT = "ASSISTANT"
    USER = "USER"

# 1. User
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    security_settings = relationship("SecuritySettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    professional_profiles = relationship("ProfessionalProfile", back_populates="user", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="user", cascade="all, delete-orphan")
    daily_reports = relationship("DailyReport", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# 2. UserProfile
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    bio = Column(Text, nullable=True)
    current_title = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    timezone = Column(String(100), default="UTC")
    status_message = Column(String(255), default="In a meeting / Busy")
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

# 3. SecuritySettings
class SecuritySettings(Base):
    __tablename__ = "security_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    emergency_pin_hash = Column(String(255), default="1234")
    dnd_bypass_demo_mode = Column(Boolean, default=True)
    notify_email = Column(Boolean, default=True)
    notify_sms = Column(Boolean, default=False)
    auto_record_calls = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="security_settings")

# 4. Resume
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=False)
    pii_detected = Column(JSON, default=dict)
    sanitized_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    professional_profile = relationship("ProfessionalProfile", back_populates="resume", uselist=False)

# 5. ProfessionalProfile (Sanitized, safe for Interview AI)
class ProfessionalProfile(Base):
    __tablename__ = "professional_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    summary = Column(Text, nullable=True)
    skills = Column(JSON, default=list)            # ["Python", "FastAPI", "React", ...]
    work_experience = Column(JSON, default=list)   # [{"company": "...", "role": "...", "dates": "...", "highlights": [...]}]
    education = Column(JSON, default=list)         # [{"degree": "...", "institution": "...", "year": "..."}]
    projects = Column(JSON, default=list)          # [{"name": "...", "technologies": [...], "description": "..."}]
    internships = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    achievements = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="professional_profiles")
    resume = relationship("Resume", back_populates="professional_profile")

# 6. Call
class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    caller_number = Column(String(50), nullable=False)
    caller_name = Column(String(255), default="Unknown Caller")
    category = Column(String(50), default=CallCategoryEnum.UNKNOWN.value)
    urgency = Column(String(50), default=UrgencyLevelEnum.NORMAL.value)
    status = Column(String(50), default=CallStatusEnum.COMPLETED.value)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    is_video = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="calls")
    participants = relationship("CallParticipant", back_populates="call", cascade="all, delete-orphan")
    transcripts = relationship("CallTranscript", back_populates="call", cascade="all, delete-orphan", order_by="CallTranscript.timestamp_offset_ms")
    classification = relationship("CallClassification", back_populates="call", uselist=False, cascade="all, delete-orphan")
    summary = relationship("CallSummary", back_populates="call", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="call", cascade="all, delete-orphan")
    emergency_event = relationship("EmergencyEvent", back_populates="call", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="call", cascade="all, delete-orphan")

# 7. CallParticipant
class CallParticipant(Base):
    __tablename__ = "call_participants"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # "caller", "assistant", "user"
    name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    call = relationship("Call", back_populates="participants")

# 8. CallTranscript
class CallTranscript(Base):
    __tablename__ = "call_transcripts"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False)
    speaker = Column(String(50), nullable=False)  # "CALLER", "ASSISTANT", "USER"
    text = Column(Text, nullable=False)
    timestamp_offset_ms = Column(Integer, default=0)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="transcripts")

# 9. CallClassification
class CallClassification(Base):
    __tablename__ = "call_classifications"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, unique=True)
    primary_category = Column(String(50), nullable=False)
    confidence = Column(Float, default=0.9)
    secondary_categories = Column(JSON, default=list)
    reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="classification")

# 10. CallSummary
class CallSummary(Base):
    __tablename__ = "call_summaries"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, unique=True)
    overview = Column(Text, nullable=False)
    key_decisions = Column(JSON, default=list)
    questions_asked = Column(JSON, default=list)
    questions_answered = Column(JSON, default=list)
    questions_private = Column(JSON, default=list)
    questions_unrelated = Column(JSON, default=list)
    questions_uncertain = Column(JSON, default=list)
    follow_ups = Column(JSON, default=list)
    ai_confidence = Column(Float, default=0.92)
    created_at = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="summary")

# 11. ActionItem
class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False)
    task = Column(Text, nullable=False)
    assignee = Column(String(255), default="User")
    due_date = Column(String(100), nullable=True)
    priority = Column(String(50), default="Medium")
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="action_items")

# 12. EmergencyEvent
class EmergencyEvent(Base):
    __tablename__ = "emergency_events"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, unique=True)
    severity = Column(String(50), default=UrgencyLevelEnum.POTENTIAL_EMERGENCY.value)
    trigger_reason = Column(Text, nullable=False)
    caller_claimed_emergency = Column(Boolean, default=True)
    is_dismissed = Column(Boolean, default=False)
    dismissed_at = Column(DateTime, nullable=True)
    dismissed_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="emergency_event")

# 13. DailyReport
class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_date = Column(String(50), nullable=False)  # "YYYY-MM-DD"
    total_calls = Column(Integer, default=0)
    category_breakdown = Column(JSON, default=dict)
    high_priority_count = Column(Integer, default=0)
    executive_summary = Column(Text, nullable=False)
    highlights = Column(JSON, default=list)
    action_items_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="daily_reports")

# 14. Notification
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String(50), default="INFO")  # INFO, WARNING, EMERGENCY
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    call = relationship("Call", back_populates="notifications")
