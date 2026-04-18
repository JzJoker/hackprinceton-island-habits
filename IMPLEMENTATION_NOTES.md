# Onboarding Flow Implementation - Progress Report

## ✅ Completed

### Frontend (apps/app)
- **Convex Provider Setup**
  - Initialized ConvexProvider in main.tsx
  - Ready to connect to Convex backend (once URL is set in VITE_CONVEX_URL)

- **Three-Step Onboarding Flow** (OnboardingPage.tsx)
  1. **Code Entry** - User enters 6-character game code from group chat
  2. **Phone Selection** - User selects their phone number from group members
  3. **Goals Entry** - User enters 1-5 weekly goals
  
  All steps include proper validation, error handling, and responsive mobile UI

- **Dashboard** (DashboardPage.tsx)
  - Island stats display (Level, XP, Currency, Motivation)
  - Daily goals list with check-in UI
  - Placeholder for Three.js island rendering
  - Quick action buttons for Goals, Build, Group

- **Navigation**
  - Home page with "Join a Game" entry point
  - Routing: / → /onboarding → /dashboard
  - Responsive design with Tailwind CSS

### Backend (apps/agent)
- **Photon Integration Stubs** (photon/app.ts, photon/handlers.ts)
  - Message handling framework
  - `/start` command handler to create new island games
  - Message sending infrastructure
  - Extracts group member phone numbers

- **Mock Implementation**
  - Ready to wire in real Photon SDK
  - Flow: `/start` → generate code → send to group chat → link to onboarding

### Convex Backend
- **Schema** (convex/schema.ts)
  - Complete data model with all tables:
    - `islands` - game instances
    - `users` - player profiles
    - `islandMembers` - group memberships
    - `agents` - AI personalities
    - `goals` - player goals
    - `checkIns` - daily progress tracking
    - `buildings` - island structures
    - `events` - game history
    - `aiMessages` - agent communications

- **Functions**
  - `islands.ts` - Create island, get by code, join, activate
  - `goals.ts` - Add/get goals, check-in, track daily progress
  - `agents.ts` - Create agent personality, update motivation

- **Indexes** - Properly indexed for common queries

---

## 🔄 In Progress / To Wire

### Convex Integration
- [ ] Generate TypeScript API types (`convex/_generated/api.ts`)
  - Run: `npx convex codegen`
- [ ] Connect frontend mutations to real Convex functions
  - Replace mock functions in OnboardingPage with actual Convex mutations
- [ ] Set VITE_CONVEX_URL environment variable
- [ ] Test end-to-end onboarding flow

### Photon iMessage Integration
- [ ] Install Photon AI SDK in agent workspace
- [ ] Implement `PhotonApp.sendMessage()` with actual Photon API calls
- [ ] Implement message listening with group chat webhooks
- [ ] Extract group member info from Photon metadata
- [ ] Deploy agent to receive `/start` commands

---

## 📋 Key File Structure

```
hackPrinceton26/
├── convex/
│   ├── schema.ts          # Database schema with all tables
│   ├── islands.ts         # Island creation & management functions
│   ├── goals.ts           # Goal & check-in functions
│   ├── agents.ts          # Agent personality functions
│   └── _generated/        # Auto-generated API types (run codegen)
│
├── apps/app/src/
│   ├── App.tsx            # Main routing
│   ├── main.tsx           # Convex + Router setup
│   ├── pages/
│   │   ├── OnboardingPage.tsx   # Code → Phone → Goals flow
│   │   └── DashboardPage.tsx    # Island view & check-in UI
│   └── index.css          # Tailwind styles
│
└── apps/agent/src/
    ├── index.ts           # Agent entry point
    └── photon/
        ├── app.ts         # Photon API wrapper
        └── handlers.ts    # Message handler + /start logic
```

---

## 🚀 Next Steps

1. **Setup Convex**
   ```bash
   npx convex auth
   npx convex codegen
   npx convex deploy --prod  # or dev
   ```

2. **Setup Photon**
   - Get Photon API key and credentials
   - Install SDK: `npm install photon-ai` (or similar)
   - Implement real `PhotonApp.sendMessage()`

3. **Test Locally**
   ```bash
   npm run dev  # Frontend + agent in parallel
   # Set VITE_CONVEX_URL to local/dev Convex URL
   # Visit http://localhost:5173
   ```

4. **Test Flow**
   - Trigger `/start` in iMessage group chat
   - Get game code from bot message
   - Go to /onboarding with code
   - Select phone, enter goals
   - Verify data saved in Convex
   - See dashboard with island

---

## ⚠️ Current Limitations / Mocks

- OnboardingPage uses mock Convex calls (logs only, doesn't actually save)
- Photon handlers don't send real messages (logs only)
- No Three.js rendering (placeholder div on dashboard)
- No K2 Think V2 personality generation (placeholder text)
- No real-time sync yet (Convex queries not hooked up)

All of these are straightforward to wire up once Convex and Photon credentials are set.

---

## 🎯 Success Criteria

✅ Onboarding flow UI is complete and responsive  
✅ Convex schema is comprehensive and indexed  
✅ Convex functions are written and ready to deploy  
✅ Photon handler stubs are in place  
✅ App builds without errors  
⏳ Convex codegen needed  
⏳ Photon SDK integrated  
⏳ End-to-end test with real data  
