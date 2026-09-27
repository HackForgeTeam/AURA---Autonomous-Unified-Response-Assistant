import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_live_call_representative_pipeline():
    # 1. Start live call simulation
    sim_resp = client.post("/api/v1/calls/simulate", json={
        "caller_name": "David Miller",
        "caller_number": "+1 (415) 890-3412",
        "scenario": "INTERVIEW",
        "simulation_type": "Job Interview",
        "is_video": False,
        "first_person": False,
    })
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    call_id = sim_data["call_id"]
    greeting = sim_data["greeting"]
    print(f"\nAURA Greeting: {greeting}")
    assert "representative" in greeting.lower() or "behalf" in greeting.lower()

    # 2. Test Technical Skills Query
    resp = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "Can you tell me about your technical skills?",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["assistant_reply"]
    print(f"Skills Answer: {reply}")
    assert len(reply) > 20 and ("experience" in reply.lower() or "skills" in reply.lower() or "problem solving" in reply.lower() or "python" in reply.lower())
    assert data["classification_type"] == "ANSWERED"

    # 3. Test Internship Experience Query
    resp = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "Tell me about your internship experience.",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["assistant_reply"]
    print(f"Internship Answer: {reply}")
    assert "XYZ Technologies" in reply or "internship" in reply.lower()
    assert data["classification_type"] == "ANSWERED"

    # 4. Test Multi-Turn Context Follow-Up Query
    resp = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "What did they work on there?",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["assistant_reply"]
    print(f"Follow-Up Answer: {reply}")
    assert "FastAPI" in reply or "REST" in reply or "backend" in reply.lower()
    assert data["classification_type"] == "ANSWERED"

    # 5. Test Personal / Private Question Refusal
    resp = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "What is their personal phone number and home address?",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["assistant_reply"]
    print(f"Private Refusal: {reply}")
    assert "permission to share" in reply
    assert data["classification_type"] == "PRIVATE"

    # 6. Test Unrelated Question Refusal
    resp = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "What is your favorite movie?",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["assistant_reply"]
    print(f"Unrelated Refusal: {reply}")
    assert "outside what I’m able to discuss" in reply or "rather have the person" in reply or "call you back" in reply
    assert data["classification_type"] == "UNRELATED"

    # 7. Test Uncertain Question
    resp = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "How many years of Rust programming experience do they have?",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    reply = data["assistant_reply"]
    print(f"Uncertain Reply: {reply}")
    assert "not completely sure" in reply
    assert data["classification_type"] == "UNCERTAIN"
    assert data["confidence_level"] == "LOW"

    # 8. Finalize Call and Verify End-of-Call Report
    fin_resp = client.post(f"/api/v1/calls/{call_id}/finalize")
    assert fin_resp.status_code == 200
    call_data = fin_resp.json()
    summary = call_data["summary"]
    print("\nFinal Call Report Summary:")
    print(f"Overview: {summary['overview']}")
    print(f"Questions Answered: {summary.get('questions_answered')}")
    print(f"Questions Private: {summary.get('questions_private')}")
    print(f"Questions Unrelated: {summary.get('questions_unrelated')}")
    print(f"Questions Uncertain: {summary.get('questions_uncertain')}")

    assert len(summary.get("questions_answered", [])) >= 2
    assert len(summary.get("questions_private", [])) >= 1
    assert len(summary.get("questions_unrelated", [])) >= 1
    assert len(summary.get("questions_uncertain", [])) >= 1
