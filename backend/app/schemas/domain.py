from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.models.entities import CallCategoryEnum, UrgencyLevelEnum, CallStatusEnum, SpeakerEnum

# Base & Shared
class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# --- User & Profile Schemas ---
class UserProfileBase(BaseModel):
    bio: Optional[str] = None
    current_title: Optional[str] = None
    company: Optional[str] = None
    timezone: str = "UTC"
    status_message: str = "In a meeting / Busy"
    avatar_url: Optional[str] = None

class UserProfileRead(UserProfileBase, OrmModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class SecuritySettingsBase(BaseModel):
    dnd_bypass_demo_mode: bool = True
    notify_email: bool = True
    notify_sms: bool = False
    auto_record_calls: bool = True

class SecuritySettingsRead(SecuritySettingsBase, OrmModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class SecurityPinUpdate(BaseModel):
    current_pin: str
    new_pin: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserRead(UserBase, OrmModel):
    id: int
    created_at: datetime
    profile: Optional[UserProfileRead] = None
    security_settings: Optional[SecuritySettingsRead] = None

# --- Resume & Professional Profile Schemas ---
class PIIDetail(BaseModel):
    entity_type: str  # "EMAIL", "PHONE", "ADDRESS", "GOVT_ID", "DOB"
    masked_value: str
    original_detected: bool = True

class ResumeUploadResponse(OrmModel):
    id: int
    filename: str
    raw_character_count: int
    pii_detected_count: int
    pii_types: List[str]
    created_at: datetime

class ResumeSaveRequest(BaseModel):
    filename: Optional[str] = "resume.txt"
    raw_text: Optional[str] = ""   # Optional so None is accepted; validator coerces None → ""
    sanitized_text: Optional[str] = None
    pii_detected: Optional[Dict[str, Any]] = None

    @field_validator("raw_text", mode="before")
    @classmethod
    def coerce_raw_text_none(cls, v: Any) -> str:
        """Pydantic v2: coerce None → '' so DB NOT NULL constraint is never violated."""
        return v if v is not None else ""

class ResumeRead(OrmModel):
    id: int
    user_id: int
    filename: str
    raw_text: str
    sanitized_text: Optional[str] = None
    pii_detected: Optional[Dict[str, Any]] = None
    created_at: datetime

class ProfessionalProfileCreate(BaseModel):
    summary: Optional[str] = None
    skills: List[str] = []
    work_experience: List[Any] = []
    education: List[Any] = []
    projects: List[Any] = []
    internships: List[Any] = []
    certifications: List[Any] = []
    achievements: List[Any] = []

class ProfessionalProfileRead(ProfessionalProfileCreate, OrmModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

# --- Call Schemas ---
class CallTranscriptCreate(BaseModel):
    speaker: SpeakerEnum
    text: str
    timestamp_offset_ms: int = 0
    confidence: float = 1.0

class CallTranscriptRead(CallTranscriptCreate, OrmModel):
    id: int
    call_id: int
    created_at: datetime

class CallClassificationRead(OrmModel):
    id: int
    primary_category: CallCategoryEnum
    confidence: float
    secondary_categories: List[str] = []
    reasoning: Optional[str] = None

class CallSummaryRead(OrmModel):
    id: int
    overview: str
    key_decisions: List[str] = []
    questions_asked: List[str] = []
    questions_answered: List[str] = []
    questions_private: List[str] = []
    questions_unrelated: List[str] = []
    questions_uncertain: List[str] = []
    follow_ups: List[str] = []
    ai_confidence: float

class ActionItemRead(OrmModel):
    id: int
    call_id: int
    task: str
    assignee: str
    due_date: Optional[str] = None
    priority: str
    is_completed: bool

class ActionItemUpdate(BaseModel):
    is_completed: Optional[bool] = None
    task: Optional[str] = None
    priority: Optional[str] = None

class EmergencyEventRead(OrmModel):
    id: int
    call_id: int
    severity: UrgencyLevelEnum
    trigger_reason: str
    caller_claimed_emergency: bool
    is_dismissed: bool
    dismissed_at: Optional[datetime] = None
    dismissed_by: Optional[str] = None
    created_at: datetime

class CallRead(OrmModel):
    id: int
    user_id: int
    caller_number: str
    caller_name: str
    category: CallCategoryEnum
    urgency: UrgencyLevelEnum
    status: CallStatusEnum
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int
    is_video: bool
    created_at: datetime
    transcripts: List[CallTranscriptRead] = []
    classification: Optional[CallClassificationRead] = None
    summary: Optional[CallSummaryRead] = None
    action_items: List[ActionItemRead] = []
    emergency_event: Optional[EmergencyEventRead] = None

# --- Simulation & Interaction Schemas ---
class CallSimulateRequest(BaseModel):
    caller_name: str = "Dr. Michael Vance"
    caller_number: str = "+1 (555) 234-5678"
    scenario: CallCategoryEnum = CallCategoryEnum.NORMAL
    simulation_type: str = "Job Interview"
    opening_line: Optional[str] = None
    is_video: bool = False
    first_person: bool = True

class CallSimulateResponse(BaseModel):
    call_id: int
    caller_name: str
    caller_number: str
    status: CallStatusEnum
    greeting: str
    category_hint: CallCategoryEnum
    simulation_type: str = "Job Interview"
    first_person: bool = True

class AIInteractionRequest(BaseModel):
    call_id: int
    caller_message: str
    simulation_type: Optional[str] = None
    first_person: bool = True
    resume_text: Optional[str] = None

class AIInteractionResponse(BaseModel):
    call_id: int
    assistant_reply: str
    detected_intent: CallCategoryEnum
    detected_urgency: UrgencyLevelEnum
    is_emergency: bool
    requires_user_alert: bool
    interview_grounded: bool = False
    classification_type: str = "ANSWERED"
    confidence_level: str = "HIGH"
    topic: Optional[str] = None

class EmergencyDismissRequest(BaseModel):
    emergency_id: int
    pin: str
    dismissed_by: str = "User"

# --- Daily Report Schemas ---
class DailyReportRead(OrmModel):
    id: int
    user_id: int
    report_date: str
    total_calls: int
    category_breakdown: Dict[str, int]
    high_priority_count: int
    executive_summary: str
    highlights: List[str]
    action_items_count: int
    created_at: datetime

# --- Notification Schemas ---
class NotificationRead(OrmModel):
    id: int
    user_id: int
    call_id: Optional[int] = None
    title: str
    message: str
    level: str
    is_read: bool
    created_at: datetime
