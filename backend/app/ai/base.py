from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.entities import CallCategoryEnum, UrgencyLevelEnum

class ChatMessage(BaseModel):
    role: str  # "system", "user", "assistant"
    content: str

class IntentClassification(BaseModel):
    primary_category: CallCategoryEnum
    confidence: float
    secondary_categories: List[str] = []
    reasoning: str
    urgency: UrgencyLevelEnum

class CallSummaryOutput(BaseModel):
    overview: str
    key_decisions: List[str] = []
    questions_asked: List[str] = []
    questions_answered: List[str] = []
    questions_private: List[str] = []
    questions_unrelated: List[str] = []
    questions_uncertain: List[str] = []
    follow_ups: List[str] = []
    ai_confidence: float = 0.92
    action_items: List[Dict[str, Any]] = []

class AIResponse(BaseModel):
    reply_text: str
    detected_intent: CallCategoryEnum
    detected_urgency: UrgencyLevelEnum
    is_emergency: bool
    requires_user_alert: bool
    interview_grounded: bool = False
    grounding_notes: Optional[str] = None
    classification_type: str = "ANSWERED"  # "ANSWERED", "PRIVATE_REFUSED", "UNRELATED", "UNCERTAIN"
    confidence_level: str = "HIGH"         # "HIGH", "MEDIUM", "LOW"
    topic: Optional[str] = None

class LLMProvider(ABC):
    """Abstract Base Class for Provider-Independent AI service."""

    @abstractmethod
    async def generate_response(
        self,
        messages: List[ChatMessage],
        call_context: Optional[Dict[str, Any]] = None,
        professional_profile: Optional[Dict[str, Any]] = None
    ) -> AIResponse:
        """Generates a contextual conversation response."""
        pass

    @abstractmethod
    async def classify_call(
        self,
        transcripts: List[Dict[str, Any]],
        caller_info: Optional[Dict[str, Any]] = None
    ) -> IntentClassification:
        """Classifies call intent and urgency from conversation transcripts."""
        pass

    @abstractmethod
    async def summarize_call(
        self,
        transcripts: List[Dict[str, Any]],
        call_metadata: Optional[Dict[str, Any]] = None
    ) -> CallSummaryOutput:
        """Generates structured post-call summary, decisions, and action items."""
        pass
