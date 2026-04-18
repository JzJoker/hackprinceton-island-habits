import os
import requests

AGENT_URL = os.environ.get("AGENT_URL", "http://localhost:3001")


def send_message(phone: str, message: str) -> None:
    resp = requests.post(
        f"{AGENT_URL}/send",
        headers={"Content-Type": "application/json"},
        json={"to": phone, "message": message},
        timeout=30,
    )
    resp.raise_for_status()


def send_group_message(phones: list[str], message: str) -> None:
    resp = requests.post(
        f"{AGENT_URL}/send-group",
        headers={"Content-Type": "application/json"},
        json={"participants": phones, "message": message},
        timeout=30,
    )
    resp.raise_for_status()
