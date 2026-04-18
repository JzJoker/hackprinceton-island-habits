# Island Habits - Quick Start Guide

## What's Been Built ✅

The complete onboarding flow is implemented and ready to use:

1. **Frontend Onboarding** - Three-step flow (code → phone → goals)
2. **Dashboard** - Island view with check-in UI
3. **Convex Backend** - Full schema + functions for all onboarding operations
4. **Photon Agent** - Message handler stubs for `/start` command
5. **Responsive Design** - Mobile-first UI with Tailwind CSS

## To Get It Working 🚀

### Step 1: Setup Convex

```bash
# Navigate to the root
cd /Users/columbus/Development/hackPrinceton26

# Login to Convex
npx convex auth

# Generate TypeScript types for the frontend
npx convex codegen

# Deploy to Convex (development or production)
npx convex deploy --prod
# or: npx convex deploy  (for dev)
```

Then get your Convex URL and set it in the environment:

```bash
# In apps/app/.env.local
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### Step 2: Wire Up Photon SDK (Backend)

1. Get Photon AI API credentials
2. Install Photon SDK in apps/agent:
   ```bash
   cd apps/agent
   npm install photon-ai  # or actual package name
   ```

3. Update `apps/agent/src/photon/app.ts` to initialize Photon:
   ```typescript
   const photonClient = new PhotonClient({
     apiKey: process.env.PHOTON_API_KEY,
   })
   ```

4. Implement `sendMessage()` with actual Photon API calls

5. Implement message listening with Photon webhooks

### Step 3: Connect Frontend to Convex

The mock functions in OnboardingPage.tsx need to be replaced with real Convex calls:

1. Uncomment/update the imports in `OnboardingPage.tsx`:
   ```typescript
   import { useMutation } from 'convex/react'
   import { api } from '../../convex/_generated/api'
   ```

2. Replace mock functions with:
   ```typescript
   const getIslandByCode = useMutation(api.islands.getIslandByCode)
   const addGoals = useMutation(api.goals.addGoals)
   const joinIsland = useMutation(api.islands.joinIsland)
   const createAgent = useMutation(api.agents.createAgent)
   ```

3. Update handlers to use real Convex functions instead of `mockGetIslandByCode`, etc.

### Step 4: Test End-to-End

```bash
# Terminal 1 - Frontend dev server
cd apps/app
npm run dev

# Terminal 2 - Agent (when Photon is ready)
cd apps/agent
npm run dev
```

Then:

1. Open http://localhost:5173 in browser
2. Click "Join a Game"
3. Enter a code (or trigger `/start` from your agent)
4. Select a phone number
5. Enter goals
6. Verify data shows up in Convex dashboard

---

## Architecture Overview

```
Group Chat (iMessage)
        ↓
   /start command
        ↓
Agent (apps/agent/)
  - Receives /start
  - Generates code
  - Creates island in Convex
  - Sends code to group
        ↓
        ↓ User clicks link
        ↓
Frontend (apps/app/)
  - Onboarding: code → phone → goals
  - Saves to Convex
  - Redirects to Dashboard
        ↓
        ↓
   Convex Database
  - Islands
  - Goals
  - Agents
  - Check-ins
  - Events
```

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend UI | ✅ Complete | Responsive, mobile-first |
| Convex Schema | ✅ Complete | All tables indexed |
| Convex Functions | ✅ Complete | Ready to deploy |
| Photon Stubs | ✅ Complete | Need SDK + API key |
| API Type Gen | ⏳ Need codegen | `npx convex codegen` |
| End-to-End Test | ⏳ Awaiting setup | After Convex + Photon |

---

## Key Files

- `CLAUDE.md` - Architecture & tech stack overview
- `CLAUDE.md` - Game design & features
- `IMPLEMENTATION_NOTES.md` - Detailed progress report
- `TASKLIST.md` - Checklist of completed & remaining tasks
- `convex/` - All backend functions & schema
- `apps/app/src/pages/OnboardingPage.tsx` - The onboarding flow UI
- `apps/app/src/pages/DashboardPage.tsx` - Island dashboard UI
- `apps/agent/src/photon/` - Message handler stubs

---

## Troubleshooting

**"Module not found: convex/_generated/api"**
→ Run `npx convex codegen` after deploying schema to Convex

**"VITE_CONVEX_URL not set"**
→ Add to `apps/app/.env.local`: `VITE_CONVEX_URL=https://your-project.convex.cloud`

**"Build fails with TypeScript errors"**
→ Make sure Convex is deployed and codegen has been run

**"Photon messages not sending"**
→ Check API key is set and SDK is properly initialized in `photon/app.ts`

---

## Next Big Features

Once onboarding is working:

1. **Three.js Island Rendering** - Isometric 3D island with characters
2. **Daily Loop** - Cron jobs for reminders, miss detection, summaries
3. **Building System** - Grid-based construction
4. **K2 Think V2 Integration** - AI personality generation
5. **Real-time Sync** - Convex reactive queries pushing updates
6. **Ascension** - Moving to new island tier

See TASKLIST.md for full breakdown.

---

**Questions?** Check CLAUDE.md for architecture and IMPLEMENTATION_NOTES.md for detailed progress.
