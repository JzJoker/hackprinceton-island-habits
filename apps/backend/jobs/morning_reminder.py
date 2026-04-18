import random
from datetime import datetime, timezone

from flask import jsonify

from jobs import jobs_bp
from jobs.convex_client import get_client
from jobs.k2 import generate_morning_reminder
from jobs.photon import send_message

DEFAULT_PERSONALITY = {
    "personality_type": "Cheerful Motivator",
    "tone": "upbeat and warm, speaks like an enthusiastic friend who genuinely believes in you",
    "quirks": [
        "peppers messages with small observations about island life",
        "always ends with a short encouraging nudge"
    ],
}


@jobs_bp.post("/morning-reminder")
def morning_reminder():
    db = get_client()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    members = db.query("jobQueries:getActiveMembersWithGoals")
    sent = 0
    skipped = 0

    for entry in members:
        agent = entry["agent"]
        phone_number = entry["phoneNumber"]
        goals = entry["goals"]

        already_sent = db.query("jobQueries:reminderSentToday", {
            "agentId": agent["_id"],
            "today": today,
        })
        if already_sent:
            skipped += 1
            continue

        miss_streak = db.query("jobQueries:recentMissCount", {
            "islandId": entry["island"]["_id"],
            "phoneNumber": phone_number,
            "days": 7,
        })

        goal_texts = [g["text"] for g in goals]
        variants = agent.get("reminderVariants") or []
        personality = agent.get("personalityProfile") or DEFAULT_PERSONALITY

        if variants and miss_streak < 3:
            message = random.choice(variants)
            reasoning = None
        else:
            message, reasoning = generate_morning_reminder(personality, goal_texts, miss_streak)

        send_message(phone_number, message)

        context = {"date": today, "missStreak": miss_streak}
        if reasoning:
            context["reasoning"] = reasoning

        db.mutation("jobMutations:logAiMessage", {
            "agentId": agent["_id"],
            "channel": "imessage_personal",
            "content": message,
            "context": context,
        })
        sent += 1

    return jsonify({"ok": True, "sent": sent, "skipped": skipped})



