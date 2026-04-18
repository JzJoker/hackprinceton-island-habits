import os
import random
from datetime import datetime, timezone

import requests
from flask import jsonify

from jobs import jobs_bp
from jobs.convex_client import get_client
from jobs.photon import send_message

K2_API_URL = os.environ.get("K2_API_URL", "")
K2_API_KEY = os.environ.get("K2_API_KEY", "")


@jobs_bp.post("/morning-reminder")
def morning_reminder():
    db = get_client()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    members = db.query("jobQueries:getActiveMembersWithGoals")
    sent = 0
    skipped = 0

    for entry in members:
        agent = entry["agent"]
        user = entry["user"]
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
            "userId": user["_id"],
            "days": 7,
        })

        goal_texts = [g["text"] for g in goals]
        variants = agent.get("reminderVariants", [])

        if variants and miss_streak < 3:
            message = random.choice(variants)
        else:
            message = _generate_k2_reminder(agent["personalityProfile"], goal_texts, miss_streak)

        send_message(user["phoneNumber"], message)

        db.mutation("jobMutations:logAiMessage", {
            "agentId": agent["_id"],
            "channel": "imessage_personal",
            "content": message,
            "context": {"date": today, "missStreak": miss_streak},
        })
        sent += 1

    return jsonify({"ok": True, "sent": sent, "skipped": skipped})


def _generate_k2_reminder(personality: dict, goal_texts: list[str], miss_streak: int) -> str:
    streak_note = (
        f"They have missed their goals for {miss_streak} days in a row." if miss_streak >= 3 else ""
    )
    prompt = (
        f"You are an AI agent with this personality: {personality}.\n"
        f"Write a short morning reminder (1-2 sentences, in character) for your player "
        f"about their goals: {', '.join(goal_texts)}.\n"
        f"{streak_note}\n"
        "Stay true to your personality. Do not use hashtags or emojis."
    )
    resp = requests.post(
        K2_API_URL,
        headers={"Authorization": f"Bearer {K2_API_KEY}", "Content-Type": "application/json"},
        json={"model": "k2-think-v2", "messages": [{"role": "user", "content": prompt}], "max_tokens": 100},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


