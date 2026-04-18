import os

import requests
from flask import jsonify

from jobs import jobs_bp
from jobs.convex_client import get_client

PHOTON_API_URL = os.environ.get("PHOTON_API_URL", "")
PHOTON_API_KEY = os.environ.get("PHOTON_API_KEY", "")
K2_API_URL = os.environ.get("K2_API_URL", "")
K2_API_KEY = os.environ.get("K2_API_KEY", "")


@jobs_bp.post("/weekly-summary")
def weekly_summary():
    db = get_client()

    islands = db.query("jobQueries:getIslandsForWeeklySummary")
    sent = 0

    for entry in islands:
        island = entry["island"]
        phones = entry["phones"]
        events = entry["events"]

        if not phones:
            continue

        stats = _aggregate_stats(events, island)
        tone = _determine_tone(stats["completion_rate"])
        narrative = _generate_narrative(stats, tone, island["name"])

        _send_photon_group(phones, narrative)

        # Use first agent on island for logging
        agents = db.query("jobQueries:getActiveMembersWithGoals")
        island_agent = next(
            (e["agent"] for e in agents if e["island"]["_id"] == island["_id"]),
            None,
        )
        if island_agent:
            db.mutation("jobMutations:recordWeeklySummary", {
                "islandId": island["_id"],
                "agentId": island_agent["_id"],
                "content": narrative,
                "stats": stats,
            })

        sent += 1

    return jsonify({"ok": True, "summaries_sent": sent})


def _aggregate_stats(events: list, island: dict) -> dict:
    check_ins = [e for e in events if e["type"] == "check_in"]
    misses = [e for e in events if e["type"] == "miss"]
    builds_complete = [e for e in events if e["type"] == "build_complete"]
    damages = [e for e in events if e["type"] == "damage"]

    total = len(check_ins) + len(misses)
    completion_rate = (len(check_ins) / total) if total > 0 else 0.0

    # Count per user
    user_checkins: dict = {}
    for e in check_ins:
        uid = (e.get("payload") or {}).get("userId", "unknown")
        user_checkins[uid] = user_checkins.get(uid, 0) + 1

    user_misses: dict = {}
    for e in misses:
        uid = (e.get("payload") or {}).get("userId", "unknown")
        user_misses[uid] = user_misses.get(uid, 0) + 1

    top_completer = max(user_checkins, key=user_checkins.get) if user_checkins else None
    top_misser = max(user_misses, key=user_misses.get) if user_misses else None

    return {
        "completion_rate": completion_rate,
        "total_checkins": len(check_ins),
        "total_misses": len(misses),
        "builds_completed": len(builds_complete),
        "buildings_damaged": len(damages),
        "top_completer": top_completer,
        "top_misser": top_misser,
        "island_level": island.get("islandLevel", 1),
    }


def _determine_tone(completion_rate: float) -> str:
    if completion_rate >= 0.8:
        return "happy and proud — the island is thriving"
    elif completion_rate >= 0.5:
        return "calm and reflective — a steady week"
    else:
        return "quiet and understanding — never judgmental, just honest about a hard week"


def _generate_narrative(stats: dict, tone: str, island_name: str) -> str:
    prompt = (
        f"You are the island '{island_name}' speaking to its inhabitants.\n"
        f"Write a short weekly summary paragraph (3-5 sentences) in first person from the island's perspective.\n"
        f"Tone: {tone}.\n"
        f"This week: {stats['total_checkins']} goals completed, {stats['total_misses']} missed, "
        f"{stats['builds_completed']} buildings finished, {stats['buildings_damaged']} buildings damaged.\n"
        f"The island is at level {stats['island_level']}.\n"
        "Do not use hashtags or emojis. Make it feel personal and alive."
    )
    resp = requests.post(
        K2_API_URL,
        headers={"Authorization": f"Bearer {K2_API_KEY}", "Content-Type": "application/json"},
        json={"model": "k2-think-v2", "messages": [{"role": "user", "content": prompt}], "max_tokens": 200},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def _send_photon_group(phones: list[str], message: str) -> None:
    resp = requests.post(
        f"{PHOTON_API_URL}/send-group",
        headers={"Authorization": f"Bearer {PHOTON_API_KEY}", "Content-Type": "application/json"},
        json={"participants": phones, "message": message},
        timeout=30,
    )
    resp.raise_for_status()
