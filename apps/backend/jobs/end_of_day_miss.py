import os
from datetime import datetime, timezone

import requests
from flask import jsonify

from jobs import jobs_bp
from jobs.convex_client import get_client
from jobs.photon import send_group_message

K2_API_URL = os.environ.get("K2_API_URL", "")
K2_API_KEY = os.environ.get("K2_API_KEY", "")

MOTIVATION_PENALTY = {"easy": 5, "normal": 10, "hard": 15}


@jobs_bp.post("/end-of-day-miss")
def end_of_day_miss():
    db = get_client()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    unchecked = db.query("jobQueries:getUncheckedGoalsForDate", {"date": today})
    processed = 0
    skipped = 0

    for entry in unchecked:
        goal = entry["goal"]
        island = entry["island"]
        user = entry["user"]
        agent = entry["agent"]

        already_missed = db.query("jobQueries:missAlreadyRecorded", {
            "goalId": goal["_id"],
            "date": today,
        })
        if already_missed:
            skipped += 1
            continue

        penalty = MOTIVATION_PENALTY.get(island["difficulty"], 10)
        prev_motivation = agent["motivation"]
        new_motivation = max(0, prev_motivation - penalty)

        db.mutation("jobMutations:recordMiss", {
            "goalId": goal["_id"],
            "userId": user["_id"],
            "islandId": island["_id"],
            "agentId": agent["_id"],
            "newMotivation": new_motivation,
            "date": today,
        })

        db.mutation("jobMutations:damageConstructingBuilding", {
            "islandId": island["_id"],
            "userId": user["_id"],
        })

        # Broadcast low-motivation message if threshold just crossed
        if new_motivation < 30 and prev_motivation >= 30:
            message = _generate_low_motivation_message(agent["personalityProfile"], new_motivation)
            phones = db.query("jobQueries:getIslandPhoneNumbers", {"islandId": island["_id"]})
            send_group_message(phones, message)
            db.mutation("jobMutations:logAiMessage", {
                "agentId": agent["_id"],
                "channel": "imessage_group",
                "content": message,
                "context": {"motivation": new_motivation},
            })

        processed += 1

    return jsonify({"ok": True, "processed": processed, "skipped": skipped})


def _generate_low_motivation_message(personality: dict, motivation: int) -> str:
    prompt = (
        f"You are an AI agent with this personality: {personality}.\n"
        f"Your motivation has dropped to {motivation}/100 because your player has been missing their goals.\n"
        "Write a short message (1-2 sentences, in character) to send to the group chat to let them know you're struggling.\n"
        "An anxious agent sounds worried, a stoic agent is brief, a humorous agent jokes about themselves.\n"
        "Do not use hashtags or emojis."
    )
    resp = requests.post(
        K2_API_URL,
        headers={"Authorization": f"Bearer {K2_API_KEY}", "Content-Type": "application/json"},
        json={"model": "k2-think-v2", "messages": [{"role": "user", "content": prompt}], "max_tokens": 80},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


