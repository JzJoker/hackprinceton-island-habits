from flask import jsonify

from jobs import jobs_bp
from jobs.convex_client import get_client


@jobs_bp.post("/build-progress-tick")
def build_progress_tick():
    db = get_client()

    buildings = db.query("jobQueries:getConstructingBuildings")
    updated = 0
    completed = 0

    for entry in buildings:
        building = entry["building"]
        agents = entry["agents"]

        if not agents:
            continue

        avg_motivation = sum(a["motivation"] for a in agents) / len(agents)
        progress_per_day = (avg_motivation / 100) / building["buildTimeDays"]
        new_progress = min(1.0, building["buildProgress"] + progress_per_day)
        is_complete = new_progress >= 1.0

        db.mutation("jobMutations:advanceBuildProgress", {
            "buildingId": building["_id"],
            "newProgress": new_progress,
            "isComplete": is_complete,
        })

        if is_complete:
            completed += 1
        else:
            updated += 1

    return jsonify({"ok": True, "updated": updated, "completed": completed})
