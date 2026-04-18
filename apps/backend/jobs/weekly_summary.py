from flask import jsonify

from jobs import jobs_bp
from jobs.convex_client import get_client
from jobs.k2 import generate_weekly_summary
from jobs.photon import send_group_message


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
        narrative, reasoning = generate_weekly_summary(
            stats["total_checkins"],
            stats["total_misses"],
            stats["builds_completed"],
            stats["top_completer"] or "nobody",
        )
        if reasoning:
            stats["reasoning"] = reasoning

        send_group_message(phones, narrative)

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

    # Count per participant
    user_checkins: dict = {}
    for e in check_ins:
        pid = (e.get("payload") or {}).get("phoneNumber", "unknown")
        user_checkins[pid] = user_checkins.get(pid, 0) + 1

    user_misses: dict = {}
    for e in misses:
        pid = (e.get("payload") or {}).get("phoneNumber", "unknown")
        user_misses[pid] = user_misses.get(pid, 0) + 1

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



