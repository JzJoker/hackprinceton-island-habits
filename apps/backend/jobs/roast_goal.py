from flask import jsonify, request

from jobs import jobs_bp
from jobs.k2 import roast_goal as _roast_goal


@jobs_bp.post("/roast-goal")
def roast_goal():
    body = request.get_json(silent=True) or {}
    player_name = (body.get("player_name") or "").strip()
    proposed_goal = (body.get("proposed_goal") or "").strip()

    if not player_name or not proposed_goal:
        return jsonify({"error": "player_name and proposed_goal are required"}), 400

    message, reasoning = _roast_goal(player_name, proposed_goal)
    res = {"message": message}
    if reasoning:
        res["reasoning"] = reasoning
    return jsonify(res)
