from flask import Blueprint

jobs_bp = Blueprint("jobs", __name__, url_prefix="/jobs")

from jobs import morning_reminder, end_of_day_miss, build_progress_tick, weekly_summary  # noqa: E402, F401
