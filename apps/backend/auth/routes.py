import os
import secrets
import time
import uuid

import requests
from flask import jsonify, request

from auth import auth_bp
from jobs.convex_client import get_client

AGENT_URL = os.environ.get("AGENT_URL", "http://localhost:3001")

OTP_TTL = 600  # 10 minutes

# In-memory store: {phone: {code, expires_at}}
_pending: dict[str, dict] = {}


@auth_bp.post("/request-otp")
def request_otp():
    body = request.get_json(silent=True) or {}
    phone = (body.get("phone") or "").strip()

    if not phone:
        return jsonify({"error": "phone is required"}), 400

    now = time.time()

    # Reuse existing valid code to avoid spamming
    existing = _pending.get(phone)
    if existing and existing["expires_at"] > now:
        code = existing["code"]
    else:
        code = f"{secrets.randbelow(1_000_000):06d}"
        _pending[phone] = {"code": code, "expires_at": now + OTP_TTL}

    _send_otp(phone, code)

    return jsonify({"ok": True})


@auth_bp.post("/verify-otp")
def verify_otp():
    body = request.get_json(silent=True) or {}
    phone = (body.get("phone") or "").strip()
    code = (body.get("code") or "").strip()

    if not phone or not code:
        return jsonify({"error": "phone and code are required"}), 400

    entry = _pending.get(phone)
    if not entry:
        return jsonify({"error": "No code found for this number. Request a new one."}), 400

    if time.time() > entry["expires_at"]:
        del _pending[phone]
        return jsonify({"error": "Code expired. Request a new one."}), 400

    if not secrets.compare_digest(entry["code"], code):
        return jsonify({"error": "Incorrect code."}), 400

    del _pending[phone]

    db = get_client()
    user_id = db.mutation("authMutations:upsertUser", {"phoneNumber": phone})

    token = str(uuid.uuid4())
    db.mutation("authMutations:createSession", {"token": token, "userId": user_id})

    return jsonify({"ok": True, "token": token, "userId": user_id})


def _send_otp(phone: str, code: str) -> None:
    message = f"Your Island of Habits code: {code}"
    resp = requests.post(
        f"{AGENT_URL}/send",
        headers={"Content-Type": "application/json"},
        json={"to": phone, "message": message},
        timeout=30,
    )
    resp.raise_for_status()
