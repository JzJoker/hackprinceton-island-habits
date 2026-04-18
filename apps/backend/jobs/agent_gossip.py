from flask import jsonify, request

from jobs import jobs_bp
from jobs.k2 import generate_agent_gossip as _generate_agent_gossip


@jobs_bp.post("/agent-gossip")
def agent_gossip():
    body = request.get_json(silent=True) or {}
    agent_personality = body.get("agent_personality")
    recent_events = body.get("recent_events") or []

    if not agent_personality:
        return jsonify({"error": "agent_personality and recent_events are required"}), 400

    try:
        result = _generate_agent_gossip(agent_personality, recent_events)
    except ValueError as e:
        return jsonify({"error": "K2 returned non-JSON", "raw": str(e)}), 502

    return jsonify(result)
