import json
import os
import re
from pathlib import Path

import requests

K2_API_URL = os.environ.get("K2_API_URL", "https://api.k2think.ai/v1/chat/completions")
K2_API_KEY = os.environ.get("K2_API_KEY", "")
K2_MODEL = os.environ.get("K2_MODEL", "MBZUAI-IFM/K2-Think-v2")

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load(name: str) -> str:
    return (PROMPTS_DIR / name).read_text()


def call_k2(system: str, user: str, max_tokens: int = 200) -> str:
    r = requests.post(
        K2_API_URL,
        headers={"Authorization": f"Bearer {K2_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": K2_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": max_tokens,
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def call_k2_json(system: str, user: str, max_tokens: int = 200) -> dict:
    raw = call_k2(system, user, max_tokens)
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.DOTALL).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(f"K2 returned non-JSON: {raw}")


# ── Named helpers ─────────────────────────────────────────────────────────────

def generate_morning_reminder(personality: dict, goal_texts: list, miss_streak: int) -> str:
    streak_note = f"Miss streak: {miss_streak} days." if miss_streak >= 3 else ""
    user = (
        f"Agent personality: {json.dumps(personality)}\n"
        f"Today's goal: {', '.join(goal_texts)}\n"
        f"{streak_note}"
    ).strip()
    return call_k2(_load("prompt_morning_reminder.md"), user, max_tokens=100)


def generate_weekly_summary(
    total_completed: int,
    total_missed: int,
    buildings_constructed: int,
    top_performer: str,
) -> str:
    user = (
        f"Total completed: {total_completed}\n"
        f"Total missed: {total_missed}\n"
        f"Buildings constructed: {buildings_constructed}\n"
        f"Top performer: {top_performer}"
    )
    return call_k2(_load("prompt_weekly_summary.md"), user, max_tokens=250)


def generate_low_motivation_message(personality: dict, motivation: int) -> str:
    user = (
        f"Failing players: [player]\n"
        f"Missed goals: multiple goals\n"
        f"Agent personality: {json.dumps(personality)}\n"
        f"Motivation level: {motivation}/100"
    )
    return call_k2(_load("prompt_mutiny_intervention.md"), user, max_tokens=150)


def generate_personality(
    player_name: str,
    approved_goals: list,
    random_seed_trait: str,
) -> dict:
    user = (
        f"Player name: {player_name}\n"
        f"Approved goals: {', '.join(approved_goals)}\n"
        f"Random seed trait: {random_seed_trait}"
    )
    return call_k2_json(_load("prompt_personality_generator.md"), user, max_tokens=200)


def roast_goal(player_name: str, proposed_goal: str) -> dict:
    user = f"Player name: {player_name}\nProposed goal: {proposed_goal}"
    return call_k2_json(_load("prompt_goal_roaster.md"), user, max_tokens=120)


def generate_agent_gossip(agent_personality: dict, recent_events: list) -> dict:
    user = (
        f"Agent personality: {json.dumps(agent_personality)}\n"
        f"Recent island events: {json.dumps(recent_events)}"
    )
    return call_k2_json(_load("prompt_agent_gossip.md"), user, max_tokens=150)


def generate_reward_item(completed_goal: str, agent_personality: dict) -> dict:
    user = (
        f"Completed goal: {completed_goal}\n"
        f"Agent personality: {json.dumps(agent_personality)}"
    )
    return call_k2_json(_load("prompt_generative_item.md"), user, max_tokens=120)


def generate_ascension_finale(
    total_days: int,
    total_buildings: int,
    total_goals: int,
) -> str:
    user = (
        f"Total days on island: {total_days}\n"
        f"Total buildings constructed: {total_buildings}\n"
        f"Total goals completed: {total_goals}"
    )
    return call_k2(_load("prompt_ascension_finale.md"), user, max_tokens=350)
