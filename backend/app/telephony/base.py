from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

class TelephonyProvider(ABC):
    """Abstract Telephony Provider interface (Twilio, Telnyx, LiveKit, Mock)."""

    @abstractmethod
    async def create_session(self, to_number: str, from_number: str, metadata: Dict[str, Any]) -> str:
        """Starts or registers a call session, returning telephony session ID."""
        pass

    @abstractmethod
    async def end_session(self, session_id: str) -> bool:
        """Terminates active call session."""
        pass

    @abstractmethod
    async def get_session_status(self, session_id: str) -> str:
        """Returns telephony provider status (ringing, in-progress, completed)."""
        pass

class MockTelephonyProvider(TelephonyProvider):
    """Mock Telephony Provider for Hackathon Simulation."""

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    async def create_session(self, to_number: str, from_number: str, metadata: Dict[str, Any]) -> str:
        session_id = f"mock-tel-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
        self._sessions[session_id] = {
            "to": to_number,
            "from": from_number,
            "status": "in-progress",
            "metadata": metadata,
            "started_at": datetime.utcnow()
        }
        return session_id

    async def end_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            self._sessions[session_id]["status"] = "completed"
            self._sessions[session_id]["ended_at"] = datetime.utcnow()
            return True
        return False

    async def get_session_status(self, session_id: str) -> str:
        session = self._sessions.get(session_id)
        if not session:
            return "not-found"
        return session.get("status", "unknown")
