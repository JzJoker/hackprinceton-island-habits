import random
from datetime import datetime, timedelta, timezone

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


@jobs_bp.get("/debug-members")
def debug_members():
    db = get_client()
    result = db.query("jobQueries:debugMemberPipeline")
    return jsonify(result)


def _format_name_list(rows: list, key: str) -> str:
    """Join ["Hùng", "An"] → "Hùng and An"; ["A","B","C"] → "A, B, and C"."""
    names = [r.get("displayName") or r.get("phone") for r in rows if r.get(key, 0) > 0]
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} and {names[1]}"
    return ", ".join(names[:-1]) + f", and {names[-1]}"


@jobs_bp.post("/morning-reminder")
def morning_reminder():
    db = get_client()
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")

    members = db.query("jobQueries:getActiveMembersWithGoals")
    sent = 0
    skipped = 0

    # Cache yesterday's team stats per island so we don't re-query for every
    # member of the same island.
    yesterday_cache: dict = {}

    for entry in members:
        agent = entry["agent"]
        phone_number = entry["phoneNumber"]
        goals = entry["goals"]
        island_id = entry["island"]["_id"]

        already_sent = db.query("jobQueries:reminderSentToday", {
            "agentId": agent["_id"],
            "today": today,
        })
        if already_sent:
            skipped += 1
            continue

        miss_streak = db.query("jobQueries:recentMissCount", {
            "islandId": island_id,
            "phoneNumber": phone_number,
            "days": 7,
        })

        # Fetch-and-cache yesterday's island-wide stats.
        if island_id not in yesterday_cache:
            yesterday_cache[island_id] = db.query(
                "jobQueries:getYesterdayIslandStats",
                {"islandId": island_id, "date": yesterday},
            ) or {"completed": [], "missed": []}
        team_stats = yesterday_cache[island_id]

        # Build a human-readable summary string the prompt can drop straight in.
        completed_names = _format_name_list(team_stats.get("completed", []), "completed")
        missed_names = _format_name_list(team_stats.get("missed", []), "missed")
        parts = []
        if completed_names:
            parts.append(f"Yesterday {completed_names} hit their goals.")
        if missed_names:
            parts.append(f"{missed_names} missed theirs.")
        team_recap = " ".join(parts) if parts else "Yesterday was quiet on the island."

        goal_texts = [g["text"] for g in goals]
        variants = agent.get("reminderVariants") or []
        personality = agent.get("personalityProfile") or DEFAULT_PERSONALITY

        # Only use the pre-canned reminderVariants when nothing noteworthy
        # happened yesterday — otherwise we always want K2 to weave the recap in.
        can_use_variant = (
            variants
            and miss_streak < 3
            and not completed_names
            and not missed_names
        )
        if can_use_variant:
            message = random.choice(variants)
            reasoning = None
        else:
            message, reasoning = generate_morning_reminder(
                personality, goal_texts, miss_streak, team_recap
            )

        send_message(phone_number, message)

        context = {
            "date": today,
            "missStreak": miss_streak,
            "teamRecap": team_recap,
        }
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



