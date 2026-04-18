import base64
import os
import uuid

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

KNOT_ENVIRONMENT = os.getenv("KNOT_ENVIRONMENT", "production")
KNOT_CLIENT_ID = os.getenv("KNOT_CLIENT_ID", "")
KNOT_SECRET = os.getenv("KNOT_SECRET", "")
KNOT_BASE_URL = (
    "https://production.knotapi.com"
    if KNOT_ENVIRONMENT == "production"
    else "https://development.knotapi.com"
)


def _knot_auth_header() -> str:
    credentials = f"{KNOT_CLIENT_ID}:{KNOT_SECRET}"
    encoded = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    return f"Basic {encoded}"


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.post("/api/knot/session")
def create_knot_session():
    if not KNOT_CLIENT_ID or not KNOT_SECRET:
        return jsonify({"error": "Missing KNOT_CLIENT_ID or KNOT_SECRET."}), 500

    payload = {
        "type": "transaction_link",
        "external_user_id": f"island-habits-{uuid.uuid4()}",
    }
    headers = {
        "Authorization": _knot_auth_header(),
        "Content-Type": "application/json",
    }

    response = requests.post(
        f"{KNOT_BASE_URL}/session/create",
        json=payload,
        headers=headers,
        timeout=30,
    )

    if not response.ok:
        return (
            jsonify(
                {
                    "error": "Knot session creation failed.",
                    "status_code": response.status_code,
                    "body": response.text,
                }
            ),
            response.status_code,
        )

    return jsonify(response.json())


@app.post("/api/knot/webhook")
def knot_webhook():
    payload = request.get_json(silent=True) or {}
    event = payload.get("event") or payload.get("type")
    connection_status = payload.get("connection_status") or payload.get(
        "connectionStatus"
    )
    merchant = payload.get("merchant") or payload.get("merchant_name")

    if str(event).upper() == "AUTHENTICATED" and str(connection_status).lower() == "connected":
        print(f"onSuccess merchant connected: {merchant}")

    return jsonify({"received": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
