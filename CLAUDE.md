# CLAUDE.md

This file provides guidance to Claude Code when working on the Island of Habits project.

## Project Overview

Island of Habits is a responsive mobile-first web game that blends habit tracking with cooperative island building. A small group of friends (2-5 people) share one 3D island together, and every real-life habit they complete directly shapes how that island grows. Individual actions create collective consequences — when one person misses their goal, the entire group feels it.

Each player is represented on the island by an AI agent character with a unique personality generated at setup. These agents build structures, react to events, send personalized messages into the group chat, and slow down when their player loses momentum. The island becomes a living record of the group's shared discipline.

This is a hackathon project. Prioritize shipping a working demo over complete feature coverage.

---

## Tech Stack

**Frontend**
- Responsive web app, mobile-first design
- Three.js for low-poly isometric 3D island rendering
- Framework: React (or Next.js if SSR is needed)
- CSS with relative viewport units, flexbox, safe-area insets

**Backend**
- Dedalus Labs cloud containers host all server-side game logic
- Scheduled jobs run inside Dedalus containers (morning reminders, end-of-day miss detection, Sunday weekly summary)
- All LLM API calls originate server-side from Dedalus containers

**Database & Sync**
- Convex DB for state storage and real-time sync
- Reactive queries push state changes to all connected clients automatically
- No custom WebSocket server needed — the game is async by nature

**AI**
- K2 Think V2 (70B open-source reasoning model from MBZUAI IFM) is the single LLM for all text generation
- Used for: agent personality generation, personalized morning reminders, low-motivation messages, weekly summaries, milestone monument descriptions, ascension narratives

**Communication**
- Photon AI iMessage SDK for all outbound communication
- Handles: OTP delivery at login, group invites, personalized agent messages, reminders, summaries, ascension notifications

---

## Platform Requirements

The game is a **responsive web app** that works on any modern phone browser (primary) and desktop browsers (secondary).

**Mobile-first design principles**
- UI adapts to every phone screen size (iPhone SE to Pro Max, full Android range)
- Layouts use relative viewport units (`dvh`, `dvw`) and flexbox
- Font sizes use relative units to stay readable at any size
- Three.js canvas resizes to match actual viewport
- Respect safe areas: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`
- Touch-optimized: large tap targets, generous padding, no hover-dependent interactions

**Desktop behavior**
- Layout remains centered in a mobile-width container (~500-600px wide)
- Surrounding space can show subtle background
- Do NOT stretch UI across wide desktop screens

**No PWA / No home-screen install needed.** Users open the link in Safari/Chrome and play. Bookmarking or reopening the iMessage link is enough.

---

## Authentication Flow

Single login method: **phone number + OTP via iMessage**.

1. User opens web app, enters phone number on landing screen
2. Backend (Dedalus container) generates a one-time code
3. Code is sent through Photon directly into the user's iMessage
4. User types code into web app → authenticated
5. Convex DB stores phone number as primary user ID
6. Session persists via cookie/magic link — OTP flow only happens once per device

**No email login, no password, no Google/Apple OAuth.**

Known limitation: non-iPhone users can still access the web app but won't receive iMessage notifications. Acceptable for hackathon scope.

---

## Core Game Mechanics

### Island Creation Flow

1. User logs in → lands on dashboard
2. Taps "Create New Island" → names island, picks solo or group mode
3. If group: selects contacts or types phone numbers → Photon sends iMessage invites with deep links
4. Invited friends tap link → web app opens to join screen → OTP flow if not authenticated → joined
5. Group size: 2-5 people
6. Each player writes their own goal as free text (e.g. "go to the gym 4 times a week")
7. Group collectively picks difficulty: Easy / Normal / Hard
   - Difficulty affects currency earned per goal and damage per missed goal
8. K2 Think V2 generates a unique personality profile for each player's agent (stored in Convex)
9. Three.js renders empty island grid, agent characters spawn at default positions

### Goal Management (IMPORTANT)

Goals are **NOT** fixed at setup. Every player can manage their own goals anytime throughout the island's lifetime.

- **Add goal**: open Goals menu → "Add Goal" → write free text → appears in daily check-in list. No hard limit on count, but UI suggests 1-3 goals.
- **Edit goal**: tap existing goal → edit text (e.g. "gym 4x/week" → "gym 3x/week"). Old version saved in history. XP already earned is kept.
- **Delete goal**: tap goal → "Remove". Goal removed from check-in list. Accumulated XP stays in Island Level.
- Goal changes are **private actions** — no group vote needed.
- When a player adds/edits a goal, their agent MAY post a short in-character message into the group chat via Photon (e.g. optimistic agent: "I just added reading to my daily goals!").
- Convex schema: goals are a sub-collection per user per island, with `status` (active/archived), timestamps for create/edit/delete, and full check-in history. On edit, create a new version rather than overwriting — preserves timelapse accuracy.

### Daily Loop

**Morning reminder (8am, per user, personalized)**
1. Dedalus cron job fires at 8am
2. For each active player: pull agent personality profile + today's goals from Convex
3. Call K2 Think V2 with prompt: "You are [personality]. Write a short morning reminder (1-2 sentences) in character to remind your player about [goal]."
4. Send message via Photon to that user's iMessage
5. **Cost optimization**: pre-generate several reminder variants per agent at setup, rotate randomly. Only do fresh generation when context is special (e.g. user missed several days in a row).

**Check-in**
1. User opens web app, taps "Done" for a goal
2. Convex writes the check-in event immediately
3. Reactive queries push update to all connected clients
4. Effects:
   - Currency added to shared island pool
   - That user's agent gains motivation
   - Agent moves faster, looks happier on the island
   - Island Level gains 1 XP

**End of day miss detection**
1. Dedalus cron job runs at day rollover
2. For each active goal not checked in: record as missed
3. Effects:
   - Agent loses motivation
   - If agent was contributing to a construction, the building may become `damaged` (Convex state)
   - Damaged buildings show crack effects in Three.js
   - Damaged buildings still function but hurt overall island state if left unrepaired

**Low-motivation broadcast**
1. When an agent's motivation drops below 30, trigger K2 Think V2 to generate an in-character message
2. Photon posts the message into the group chat
3. Tone reflects personality (anxious = worried, stoic = brief, humorous = self-deprecating)
4. This is how the group learns who is struggling — delivered as character, not as a mechanical alert

### Building System

- Shared currency pool — any group member can build
- Library of 10-15 prebuilt structures (houses, libraries, sports fields, gardens, markets, observation decks, etc.)
- Each structure has: cost, grid footprint, build time (1-5 days), description
- Grid-based placement (ISLANDERS-style): valid cells highlighted green, invalid red
- Building construction is not instant — agents walk to site and work on it over multiple days
- Build speed = function of average agent motivation across the group
- Optional simple voting flow when group disagrees: propose → Photon notification → majority yes wins
- Every 5 Island Levels, an AI-generated unique monument unlocks. K2 Think V2 describes it based on that island's history — unique to the group.

### Island Level & Ascension

**Island Level progression**
- Single metric: Island Level
- Every completed goal (any player) = +1 XP
- XP curve: level 1→2 = 20 XP, level 2→3 = 30 XP, level 3→4 = 40 XP, etc. (increases by 10 per level)
- Early levels fast and satisfying, later levels require sustained commitment

**Ascension**
- At Island Level 10, "Ascend" option unlocks in the main menu
- **No other conditions** — not required to fill the grid or finish all buildings
- Any member can propose ascension via "Propose Ascension" button
- Photon sends vote notification to the group chat
- Majority yes → ascension happens
- Majority no / no majority → proposal canceled, can be re-proposed anytime

**Ascension ceremony**
1. Short Three.js animation: camera zooms out to wide island shot
2. K2 Think V2 generates journey summary ("Your first island was completed in 47 days, with 312 goals...")
3. Photon posts the summary into group chat
4. Old island freezes into a permanent monument accessible from History menu
5. New Tier 2 Island generated:
   - Larger grid (e.g. 10x10 → 15x15)
   - New terrain variations (mountains, waterfalls, special regions)
   - 5-10 new structures added to building library
   - Agents "move" to new island, keep personalities and memories
   - K2 Think V2 can reference Tier 1 history in future agent dialogue
6. Island Level resets to 1, starts accumulating again
7. No cap on tiers — can ascend indefinitely

### Weekly Summary (Sunday 8pm)

1. Dedalus cron job compiles week's data from Convex: total goals completed, top completer, top misser, structures built, structures damaged, avg agent motivation, Island Level gained
2. Pass data to K2 Think V2 with prompt to generate a short paragraph from the island's perspective
3. Tone adapts to week outcome:
   - Strong week (>80% completion) → happy and proud
   - Average week → calm and reflective
   - Hard week → quiet and understanding, never judgmental
4. Photon sends to group chat
5. **No synchronous event** — players read whenever they open chat

### History & Timelapse

- Every significant event logged to Convex with timestamp: check-ins, misses, builds, damage, repairs, agent messages, summaries, ascensions
- History is **permanent** — never deleted
- History menu: scrollable timeline, click events for details
- Timelapse: fast-forward Three.js animation of current island from day one
- Ascended islands also have viewable timelapses — accessed as "museum" entries

---

## Data Model (Convex)

High-level schema outline. Implement actual schema carefully in Convex.

**users**
- `_id`, `phoneNumber` (unique), `displayName`, `createdAt`, `lastLoginAt`

**islands**
- `_id`, `name`, `tier` (int, starts at 1), `islandLevel` (int), `xp` (int), `currency` (int), `difficulty` ('easy'|'normal'|'hard'), `gridSize` (object with width/height), `status` ('active'|'ascended'), `createdAt`, `ascendedAt`

**islandMembers**
- `_id`, `islandId`, `userId`, `joinedAt`, `role` ('creator'|'member')

**agents**
- `_id`, `islandId`, `userId`, `personalityProfile` (JSON), `motivation` (0-100), `reminderVariants` (array of pre-generated strings), `createdAt`

**goals**
- `_id`, `islandId`, `userId`, `text`, `status` ('active'|'archived'), `createdAt`, `archivedAt`, `parentGoalId` (for edited versions)

**checkIns**
- `_id`, `goalId`, `userId`, `islandId`, `date` (YYYY-MM-DD), `completed` (bool), `createdAt`

**buildings**
- `_id`, `islandId`, `type`, `gridX`, `gridY`, `footprint` (object), `state` ('constructing'|'complete'|'damaged'), `buildProgress` (0-1), `costPaid`, `placedBy` (userId), `placedAt`, `completedAt`

**events** (for history/timelapse)
- `_id`, `islandId`, `type` ('check_in'|'miss'|'build_placed'|'build_complete'|'damage'|'repair'|'agent_message'|'weekly_summary'|'ascension'|'goal_add'|'goal_edit'|'goal_delete'), `payload` (JSON), `timestamp`

**aiMessages** (optional, for logging agent outputs)
- `_id`, `agentId`, `channel` ('imessage_personal'|'imessage_group'), `content`, `context`, `sentAt`

---

## Implementation Priorities for Hackathon

Focus on shipping these in order:

**P0 — Must have for demo**
1. Phone + OTP login via Photon iMessage
2. Island creation + group invite flow
3. Goal setting (add only is fine, edit/delete can be P1)
4. Three.js basic isometric island with grid
5. Check-in flow + currency earning
6. 3-5 building types placeable on grid
7. K2 Think V2 personality generation at setup
8. Personalized morning reminder via Photon
9. Convex real-time sync between clients

**P1 — Nice to have**
1. Goal edit and delete
2. Low-motivation agent messages
3. Weekly summary
4. Damage/repair system
5. Full building library (10-15)
6. Agent dialogue when goals are added/changed

**P2 — Aspirational**
1. Ascension system + Tier 2 island
2. AI-generated milestone monuments
3. Timelapse / history view
4. Voting flow for builds
5. Build time + motivation-affected construction speed

---

## Coding Guidelines

- **Server-side first for sensitive operations**: All LLM calls, all Photon sends, all cron jobs run in Dedalus containers. Never expose API keys to the client.
- **Convex reactive queries** for all real-time UI updates — don't write custom polling or WebSocket code.
- **Touch-friendly UI**: min 44x44px tap targets, generous padding, avoid hover states.
- **Safe area everywhere** that content sits near the edge of the viewport.
- **Do not over-engineer**: this is a hackathon. Prefer simple solutions. Pre-generate reminder variants instead of live LLM calls where possible. Use majority-vote logic only where it adds real social value.
- **Preserve history on edits**: When goals are edited, create a new version rather than overwriting — the timelapse must reflect accurate historical context.
- **Idempotency**: check-ins, cron-triggered misses, and reminder jobs should all be idempotent — running twice should not double-count.

---

## What This Game Is NOT

To avoid scope creep, be clear about what is out of scope:

- Not a real-time multiplayer game with synchronized actions
- Not a PvP game — there's no competition between islands
- Not a native mobile app — web only
- Not cross-platform messaging — iMessage only (Android users can play the web app but won't get agent messages)
- Not a commerce/crypto/staking game
- Not a social network feed — communication happens in iMessage group chats, not in-app

---

## Quick Decision Reference

| Question | Answer |
|----------|--------|
| Fixed or responsive UI? | Responsive, mobile-first |
| PWA/install? | No |
| Login method? | Phone + OTP via iMessage |
| Email/password? | No |
| Real-time socket? | No — Convex reactive queries |
| LLM? | K2 Think V2 only |
| Where does LLM run? | Server-side, from Dedalus containers |
| Individual territories on the island? | No — one shared island |
| Per-player currency? | No — shared pool |
| Weekly events? | No — only a weekly summary message |
| Micro-events (bird poop, ice cream)? | No |
| Agent happiness stat? | No — only motivation |
| Can users have multiple goals? | Yes — add/edit/delete anytime |
| Expand or new tier? | Ascend to new tier (old island preserved as monument) |