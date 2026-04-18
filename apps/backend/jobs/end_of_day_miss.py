from datetime import datetime, timezone

from flask import jsonify

from jobs import jobs_bp
from jobs.convex_client import get_client
from jobs.k2 import generate_low_motivation_message
from jobs.photon import send_group_message

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
        phone_number = entry["phoneNumber"]
        agent = entry["agent"]

        already_missed = db.query("jobQueries:missAlreadyRecorded", {
            "goalId": goal["_id"],
            "date": today,
            "islandId": island["_id"],
        })
        if already_missed:
            skipped += 1
            continue

        penalty = MOTIVATION_PENALTY.get(island["difficulty"], 10)
        prev_motivation = agent["motivation"]
        new_motivation = max(0, prev_motivation - penalty)

        db.mutation("jobMutations:recordMiss", {
            "goalId": goal["_id"],
            "phoneNumber": phone_number,
            "islandId": island["_id"],
            "agentId": agent["_id"],
            "newMotivation": new_motivation,
            "date": today,
        })

        db.mutation("jobMutations:damageConstructingBuilding", {
            "islandId": island["_id"],
            "phoneNumber": phone_number,
        })

        # Broadcast low-motivation message if threshold just crossed
        if new_motivation < 30 and prev_motivation >= 30:
            message = generate_low_motivation_message(agent["personalityProfile"], new_motivation)
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



