import pytest
from app.ai.base import ChatMessage
from app.ai.mock_provider import MockLLMProvider
from app.telephony.base import MockTelephonyProvider
from app.models.entities import CallCategoryEnum, UrgencyLevelEnum

@pytest.mark.asyncio
async def test_mock_llm_interview_grounding():
    ai = MockLLMProvider()
    profile = {
        "summary": "Staff AI Engineer",
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "work_experience": [{"company": "Cognitive Dynamics", "role": "Staff AI Engineer", "dates": "2022 - Present"}]
    }

    # Test verified skill
    res1 = await ai.generate_response(
        messages=[ChatMessage(role="user", content="Does Alex have experience with FastAPI?")],
        call_context={"user_name": "Alex Chen", "category": "INTERVIEW"},
        professional_profile=profile
    )
    assert "FastAPI" in res1.reply_text
    assert res1.interview_grounded is True
    assert res1.detected_intent == CallCategoryEnum.INTERVIEW

    # Test salary refusal (PII safeguard)
    res2 = await ai.generate_response(
        messages=[ChatMessage(role="user", content="What is his salary expectation?")],
        call_context={"user_name": "Alex Chen", "category": "INTERVIEW"},
        professional_profile=profile
    )
    assert "compensation" in res2.reply_text.lower() or "salary" in res2.reply_text.lower()
    assert "private" in res2.reply_text.lower() or "confidential" in res2.reply_text.lower()

    # Test unverified skill (Anti-hallucination)
    res3 = await ai.generate_response(
        messages=[ChatMessage(role="user", content="Does Alex know quantum computing or Rust?")],
        call_context={"user_name": "Alex Chen", "category": "INTERVIEW"},
        professional_profile=profile
    )
    assert "not listed" in res3.reply_text.lower()

@pytest.mark.asyncio
async def test_mock_llm_emergency_detection():
    ai = MockLLMProvider()
    res = await ai.generate_response(
        messages=[ChatMessage(role="user", content="Alex, pick up! David is in Stanford ER hospital following an accident!")],
        call_context={"user_name": "Alex Chen"}
    )
    assert res.is_emergency is True
    assert res.requires_user_alert is True
    assert res.detected_urgency == UrgencyLevelEnum.POTENTIAL_EMERGENCY
    assert res.detected_intent == CallCategoryEnum.EMERGENCY

@pytest.mark.asyncio
async def test_telephony_provider():
    tel = MockTelephonyProvider()
    session_id = await tel.create_session("+15551234", "+15555678", {"caller": "Test"})
    assert session_id.startswith("mock-tel-")
    status = await tel.get_session_status(session_id)
    assert status == "in-progress"

    ended = await tel.end_session(session_id)
    assert ended is True
    status2 = await tel.get_session_status(session_id)
    assert status2 == "completed"

def test_api_call_interaction_and_finalization(client):
    # 1. Start a simulated call
    sim_res = client.post("/api/v1/calls/simulate", json={
        "caller_name": "Google Recruiter",
        "caller_number": "+1 (650) 253-0000",
        "scenario": "INTERVIEW",
        "is_video": False
    })
    assert sim_res.status_code == 200
    call_id = sim_res.json()["call_id"]

    # 2. Send caller turn
    interact_res = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "Tell me about his work with FastAPI and streaming architectures."
    })
    assert interact_res.status_code == 200
    data = interact_res.json()
    assert "FastAPI" in data["assistant_reply"]
    assert data["interview_grounded"] is True

    # 3. Finalize call
    final_res = client.post(f"/api/v1/calls/{call_id}/finalize")
    assert final_res.status_code == 200
    final_data = final_res.json()
    assert final_data["status"] == "COMPLETED"
    assert final_data["classification"] is not None
    assert final_data["summary"] is not None
    assert len(final_data["action_items"]) >= 1
