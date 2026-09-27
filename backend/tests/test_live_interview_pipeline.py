import urllib.request
import json

base_url = 'http://127.0.0.1:8000/api/v1'

def run_test():
    print("=== LIVE VOICE INTERVIEW PIPELINE VERIFICATION ===")

    # 1. Start simulated interview call
    sim_payload = json.dumps({
        'caller_name': 'David Miller (VP of Engineering)',
        'caller_number': '+1 (415) 890-3412',
        'scenario': 'INTERVIEW',
        'simulation_type': 'Job Interview',
        'opening_line': 'Hi Alex, thank you for joining our interview today. Could you walk me through your background and your experience building distributed real-time systems?'
    }).encode('utf-8')

    req = urllib.request.Request(f'{base_url}/calls/simulate', data=sim_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        sim_data = json.loads(resp.read().decode())

    call_id = sim_data['call_id']
    print(f"\n[1] Call Simulated successfully: Call ID #{call_id}")
    print(f"    Interviewer: {sim_data['caller_name']}")
    print(f"    Opening Greeting: \"{sim_data['greeting']}\"")
    assert "Hi Alex" in sim_data['greeting']
    assert "distributed real-time systems" in sim_data['greeting']

    # 2. Turn 1: Candidate asks identity question ("am i speaking to alex chen")
    turn1_payload = json.dumps({
        'call_id': call_id,
        'caller_message': 'am i speaking to alex chen',
        'simulation_type': 'Job Interview',
        'first_person': True
    }).encode('utf-8')

    req1 = urllib.request.Request(f'{base_url}/calls/{call_id}/interact', data=turn1_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req1) as resp1:
        t1_data = json.loads(resp1.read().decode())

    print(f"\n[2] Candidate Turn 1: \"am i speaking to alex chen\"")
    print(f"    Interviewer Reply: \"{t1_data['assistant_reply']}\"")
    assert "David Miller" in t1_data['assistant_reply']
    assert "interview" in t1_data['assistant_reply'].lower() or "role" in t1_data['assistant_reply'].lower() or "background" in t1_data['assistant_reply'].lower()

    # 3. Turn 2: Candidate answers with technical architecture (Kafka and Redis)
    turn2_payload = json.dumps({
        'call_id': call_id,
        'caller_message': 'I worked on a backend service using Kafka and Redis for real-time streaming.',
        'simulation_type': 'Job Interview',
        'first_person': True
    }).encode('utf-8')

    req2 = urllib.request.Request(f'{base_url}/calls/{call_id}/interact', data=turn2_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req2) as resp2:
        t2_data = json.loads(resp2.read().decode())

    print(f"\n[3] Candidate Turn 2: \"I worked on a backend service using Kafka and Redis for real-time streaming.\"")
    print(f"    Interviewer Follow-up: \"{t2_data['assistant_reply']}\"")
    assert "kafka" in t2_data['assistant_reply'].lower() or "redis" in t2_data['assistant_reply'].lower()
    assert "?" in t2_data['assistant_reply']

    # 4. Turn 3: Candidate deep-dive answer on partitioning and caching
    turn3_payload = json.dumps({
        'call_id': call_id,
        'caller_message': 'We handled message ordering with key-based partitioning and cached hot user session data in Redis with a 15-minute TTL.',
        'simulation_type': 'Job Interview',
        'first_person': True
    }).encode('utf-8')

    req3 = urllib.request.Request(f'{base_url}/calls/{call_id}/interact', data=turn3_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req3) as resp3:
        t3_data = json.loads(resp3.read().decode())

    print(f"\n[4] Candidate Turn 3: \"We handled message ordering with key-based partitioning and cached hot user session data in Redis with a 15-minute TTL.\"")
    print(f"    Interviewer Follow-up: \"{t3_data['assistant_reply']}\"")
    assert "?" in t3_data['assistant_reply']

    # 5. Finalize Call
    fin_req = urllib.request.Request(f'{base_url}/calls/{call_id}/finalize', data=b'{}', headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(fin_req) as resp_fin:
        fin_data = json.loads(resp_fin.read().decode())

    print(f"\n[5] Call Finalized: Status {fin_data['status']}")
    print(f"    Summary Overview: {fin_data['summary']['overview']}")
    print(f"    Action Items ({len(fin_data['action_items'])}): {[a['task'] for a in fin_data['action_items']]}")

    print("\n>>> END-TO-END VOICE INTERVIEW PIPELINE VERIFIED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    run_test()
