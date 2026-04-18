from flask import jsonify, request

from jobs import jobs_bp
from jobs.k2 import generate_chat_reply


@jobs_bp.post("/chat-reply")
def chat_reply():
    body = request.get_json(silent=True) or {}
    player_name = (body.get("player_name") or "friend").strip()
    island_context = (body.get("island_context") or "").strip()
    history = body.get("history") or []
    latest = (body.get("latest") or "").strip()

    if not latest:
        return jsonify({"error": "latest is required"}), 400
    if not isinstance(history, list):
        return jsonify({"error": "history must be a list"}), 400

    message, reasoning = generate_chat_reply(player_name, island_context, history, latest)
    res = {"message": message}
    if reasoning:
        res["reasoning"] = reasoning
    return jsonify(res)
