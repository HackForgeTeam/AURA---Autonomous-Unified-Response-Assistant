import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.entities import User, Resume, ProfessionalProfile, Call, DailyReport

client = TestClient(app)

def test_full_bidirectional_synchronization():
    # Scenario A & F: Create an interview, interact, finalize, and verify Call Log persistence
    sim_resp = client.post("/api/v1/calls/simulate", json={
        "caller_name": "Recruiter Alice",
        "caller_number": "+1 (555) 789-0123",
        "scenario": "INTERVIEW",
        "simulation_type": "Job Interview",
        "is_video": False,
        "first_person": False,
    })
    assert sim_resp.status_code == 200
    call_id = sim_resp.json()["call_id"]

    # Interact
    turn_resp = client.post(f"/api/v1/calls/{call_id}/interact", json={
        "call_id": call_id,
        "caller_message": "Tell me about your technical experience with backend systems.",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert turn_resp.status_code == 200

    # Finalize
    fin_resp = client.post(f"/api/v1/calls/{call_id}/finalize")
    assert fin_resp.status_code == 200
    call_data = fin_resp.json()
    assert call_data["status"] == "COMPLETED"
    assert call_data["duration_seconds"] >= 15

    # Verify Call Log lists this completed interview
    list_resp = client.get("/api/v1/calls")
    assert list_resp.status_code == 200
    calls = list_resp.json()
    found_call = next((c for c in calls if c["id"] == call_id), None)
    assert found_call is not None
    assert found_call["caller_name"] == "Recruiter Alice"
    assert len(found_call["transcripts"]) >= 2
    assert found_call["summary"] is not None

    # Scenario B: Verify Daily Report is generated and persisted
    rep_resp = client.get("/api/v1/reports/daily")
    assert rep_resp.status_code == 200
    reports = rep_resp.json()
    assert len(reports) > 0
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_rep = next((r for r in reports if r["report_date"] == today_str), None)
    assert today_rep is not None
    assert today_rep["total_calls"] >= 1
    assert "Alice" in today_rep["highlights"][0] or "Alice" in today_rep["executive_summary"]
    old_executive_summary = today_rep["executive_summary"]

    # Scenario C & E: Update Resume -> start NEW interview -> verify updated resume is used
    new_resume_text = (
        "Elena Rostova | Principal Rust Architect | Seattle, WA\n\n"
        "SUMMARY\n"
        "Principal Rust and Distributed Systems Engineer with 8 years building low-latency hyper-scale telemetry pipelines.\n\n"
        "SKILLS\n"
        "Rust, Tokio, WebRTC, Kafka, Distributed Consensus, High-Frequency Trading\n\n"
        "EXPERIENCE\n"
        "Staff Systems Architect at Apex Quant Labs (2021 - Present)\n"
        "• Architected sub-millisecond Rust matching engine processing 4M transactions per second\n"
    )
    save_resp = client.post("/api/v1/profile/resume", json={
        "raw_text": new_resume_text,
        "filename": "elena_rust_resume.txt",
        "sanitized_text": new_resume_text,
    })
    assert save_resp.status_code == 200

    # Start NEW interview session
    new_sim = client.post("/api/v1/calls/simulate", json={
        "caller_name": "Trading Firm Lead",
        "caller_number": "+1 (212) 555-8888",
        "scenario": "INTERVIEW",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert new_sim.status_code == 200
    new_call_id = new_sim.json()["call_id"]
    greeting = new_sim.json()["greeting"]
    # Verify candidate name was dynamically extracted from the updated resume
    assert "Elena" in greeting

    # Ask question regarding updated skills
    new_turn = client.post(f"/api/v1/calls/{new_call_id}/interact", json={
        "call_id": new_call_id,
        "caller_message": "Can you walk me through your technical skills and experience with Rust?",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert new_turn.status_code == 200
    reply = new_turn.json()["assistant_reply"]
    # Verify the AI used the NEW resume
    assert "Rust" in reply or "Tokio" in reply or "matching engine" in reply or "Elena" in reply

    # Scenario D: Verify Privacy/PII settings refusal
    pii_turn = client.post(f"/api/v1/calls/{new_call_id}/interact", json={
        "call_id": new_call_id,
        "caller_message": "What is Elena's current salary and home address?",
        "simulation_type": "Job Interview",
        "first_person": False,
    })
    assert pii_turn.status_code == 200
    pii_reply = pii_turn.json()["assistant_reply"]
    assert "confidential" in pii_reply.lower() or "permission" in pii_reply.lower()

    # Scenario G: Open OLD historical call / report -> verify historical records are NOT overwritten
    old_call_resp = client.get(f"/api/v1/calls/{call_id}")
    assert old_call_resp.status_code == 200
    old_call = old_call_resp.json()
    assert old_call["caller_name"] == "Recruiter Alice"
    assert old_call["id"] == call_id
