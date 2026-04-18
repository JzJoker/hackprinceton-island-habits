import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

// Returns all active island members with their agent, active goals, and island
export const getActiveMembersWithGoals = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("islandMembers").collect();
    const results: {
      phoneNumber: string;
      agent: Doc<"agents">;
      goals: Doc<"goals">[];
      island: Doc<"islands">;
    }[] = [];
    const islandCache = new Map<Id<"islands">, Doc<"islands"> | null>();

    for (const member of members) {
      let island = islandCache.get(member.islandId);
      if (island === undefined) {
        island = await ctx.db.get(member.islandId);
        islandCache.set(member.islandId, island);
      }
      if (!island) continue;

      const agent = await ctx.db
        .query("agents")
        .withIndex("by_island_phone", (q) =>
          q.eq("islandId", member.islandId).eq("phoneNumber", member.phoneNumber)
        )
        .unique();
      if (!agent) continue;

      const goals = await ctx.db
        .query("goals")
        .withIndex("by_island_phone", (q) =>
          q.eq("islandId", member.islandId).eq("phoneNumber", member.phoneNumber)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (goals.length === 0) continue;

      results.push({ phoneNumber: member.phoneNumber, agent, goals, island });
    }

    return results;
  },
});

// Returns true if a personal reminder was already sent to this agent today
export const reminderSentToday = query({
  args: { agentId: v.id("agents"), today: v.string() },
  handler: async (ctx, { agentId, today }) => {
    const startOfDay = new Date(today + "T00:00:00Z").getTime();
    const msg = await ctx.db
      .query("aiMessages")
      .withIndex("by_agent_sent", (q) =>
        q.eq("agentId", agentId).gte("sentAt", startOfDay)
      )
      .filter((q) =>
        q.and(
          q.lt(q.field("sentAt"), startOfDay + 86400000),
          q.eq(q.field("channel"), "imessage_personal")
        )
      )
      .first();
    return msg !== null;
  },
});

// Count missed events for a phone number on an island in the last N days
export const recentMissCount = query({
  args: { islandId: v.id("islands"), phoneNumber: v.string(), days: v.number() },
  handler: async (ctx, { islandId, phoneNumber, days }) => {
    const since = Date.now() - days * 86400000;
    const events = await ctx.db
      .query("events")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "miss"),
          q.gte(q.field("timestamp"), since)
        )
      )
      .collect();
    return events.filter(
      (e) => e.payload && (e.payload as { phoneNumber: string }).phoneNumber === phoneNumber
    ).length;
  },
});

// Returns all active goals that have no checkIn for the given date
export const getUncheckedGoalsForDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const activeGoals = await ctx.db
      .query("goals")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const results: {
      goal: Doc<"goals">;
      island: Doc<"islands">;
      phoneNumber: string;
      agent: Doc<"agents">;
    }[] = [];
    const islandCache = new Map<Id<"islands">, Doc<"islands"> | null>();

    for (const goal of activeGoals) {
      const checkIn = await ctx.db
        .query("checkIns")
        .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
        .filter((q) => q.eq(q.field("date"), date))
        .first();
      if (checkIn) continue;

      let island = islandCache.get(goal.islandId);
      if (island === undefined) {
        island = await ctx.db.get(goal.islandId);
        islandCache.set(goal.islandId, island);
      }
      if (!island) continue;

      const agent = await ctx.db
        .query("agents")
        .withIndex("by_island_phone", (q) =>
          q.eq("islandId", goal.islandId).eq("phoneNumber", goal.phoneNumber)
        )
        .unique();
      if (!agent) continue;

      results.push({ goal, island, phoneNumber: goal.phoneNumber, agent });
    }
    return results;
  },
});

// Returns true if a miss event was already recorded for this goal on this date
export const missAlreadyRecorded = query({
  args: { goalId: v.id("goals"), date: v.string(), islandId: v.id("islands") },
  handler: async (ctx, { goalId, date, islandId }) => {
    const startOfDay = new Date(date + "T00:00:00Z").getTime();
    const events = await ctx.db
      .query("events")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "miss"),
          q.gte(q.field("timestamp"), startOfDay),
          q.lt(q.field("timestamp"), startOfDay + 86400000)
        )
      )
      .collect();
    return events.some(
      (e) => e.payload && (e.payload as { goalId: string }).goalId === goalId
    );
  },
});

// Returns all constructing buildings with their island's agents
export const getConstructingBuildings = query({
  args: {},
  handler: async (ctx) => {
    const buildings = await ctx.db
      .query("buildings")
      .filter((q) => q.eq(q.field("state"), "constructing"))
      .collect();

    const results: { building: Doc<"buildings">; agents: Doc<"agents">[] }[] = [];
    for (const building of buildings) {
      const agents = await ctx.db
        .query("agents")
        .withIndex("by_island", (q) => q.eq("islandId", building.islandId))
        .collect();
      results.push({ building, agents });
    }
    return results;
  },
});

// Returns all active islands with their member phone numbers and last 7 days of events
export const getIslandsForWeeklySummary = query({
  args: {},
  handler: async (ctx) => {
    const islands = await ctx.db
      .query("islands")
      .collect();

    const since = Date.now() - 7 * 86400000;
    const results: {
      island: Doc<"islands">;
      phones: string[];
      events: Doc<"events">[];
    }[] = [];

    for (const island of islands) {
      const members = await ctx.db
        .query("islandMembers")
        .withIndex("by_island", (q) => q.eq("islandId", island._id))
        .collect();

      const phones = members.map((m) => m.phoneNumber);

      const events = await ctx.db
        .query("events")
        .withIndex("by_island", (q) => q.eq("islandId", island._id))
        .filter((q) => q.gte(q.field("timestamp"), since))
        .collect();

      results.push({ island, phones, events });
    }

    return results;
  },
});

// Debug: returns raw counts to diagnose why getActiveMembersWithGoals returns empty
export const debugMemberPipeline = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("islandMembers").collect();
    const agents = await ctx.db.query("agents").collect();
    const goals = await ctx.db.query("goals").collect();
    const islands = await ctx.db.query("islands").collect();
    return {
      memberCount: members.length,
      agentCount: agents.length,
      goalCount: goals.length,
      islandCount: islands.length,
      activeGoalCount: goals.filter((g) => g.status === "active").length,
      members: members.map((m) => ({ islandId: m.islandId, phoneNumber: m.phoneNumber })),
      agents: agents.map((a) => ({ islandId: a.islandId, phoneNumber: a.phoneNumber })),
      goals: goals.map((g) => ({ islandId: g.islandId, phoneNumber: g.phoneNumber, status: g.status })),
      islands: islands.map((i) => ({ id: i._id, status: i.status, name: i.name })),
    };
  },
});

// Get phone numbers for all members of an island
export const getIslandPhoneNumbers = query({
  args: { islandId: v.id("islands") },
  handler: async (ctx, { islandId }) => {
    const members = await ctx.db
      .query("islandMembers")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .collect();
    return members.map((m) => m.phoneNumber);
  },
});
