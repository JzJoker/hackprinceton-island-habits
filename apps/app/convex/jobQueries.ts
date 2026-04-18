import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Returns all active island members with their user, agent, active goals, and island
export const getActiveMembersWithGoals = internalQuery({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("islandMembers").collect();
    const results = [];

    for (const member of members) {
      const island = await ctx.db.get(member.islandId);
      if (!island || island.status !== "active") continue;

      const user = await ctx.db.get(member.userId);
      if (!user) continue;

      const agent = await ctx.db
        .query("agents")
        .withIndex("by_island_user", (q) =>
          q.eq("islandId", member.islandId).eq("userId", member.userId)
        )
        .unique();
      if (!agent) continue;

      const goals = await ctx.db
        .query("goals")
        .withIndex("by_island_user", (q) =>
          q.eq("islandId", member.islandId).eq("userId", member.userId)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (goals.length === 0) continue;

      results.push({ user, agent, goals, island });
    }

    return results;
  },
});

// Returns true if a personal reminder was already sent to this agent today
export const reminderSentToday = internalQuery({
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

// Count missed events for a user on an island in the last N days
export const recentMissCount = internalQuery({
  args: { islandId: v.id("islands"), userId: v.id("users"), days: v.number() },
  handler: async (ctx, { islandId, userId, days }) => {
    const since = Date.now() - days * 86400000;
    const events = await ctx.db
      .query("events")
      .withIndex("by_island_timestamp", (q) =>
        q.eq("islandId", islandId).gte("timestamp", since)
      )
      .filter((q) => q.eq(q.field("type"), "miss"))
      .collect();
    return events.filter(
      (e) => e.payload && (e.payload as { userId: string }).userId === userId
    ).length;
  },
});

// Returns all active goals that have no checkIn for the given date
export const getUncheckedGoalsForDate = internalQuery({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const activeGoals = await ctx.db
      .query("goals")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const results = [];
    for (const goal of activeGoals) {
      const checkIn = await ctx.db
        .query("checkIns")
        .withIndex("by_goal_date", (q) => q.eq("goalId", goal._id).eq("date", date))
        .unique();
      if (checkIn) continue;

      const island = await ctx.db.get(goal.islandId);
      if (!island || island.status !== "active") continue;

      const user = await ctx.db.get(goal.userId);
      if (!user) continue;

      const agent = await ctx.db
        .query("agents")
        .withIndex("by_island_user", (q) =>
          q.eq("islandId", goal.islandId).eq("userId", goal.userId)
        )
        .unique();
      if (!agent) continue;

      results.push({ goal, island, user, agent });
    }
    return results;
  },
});

// Returns true if a miss event was already recorded for this goal on this date
export const missAlreadyRecorded = internalQuery({
  args: { goalId: v.id("goals"), date: v.string() },
  handler: async (ctx, { goalId, date }) => {
    const startOfDay = new Date(date + "T00:00:00Z").getTime();
    const event = await ctx.db
      .query("events")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "miss"),
          q.gte(q.field("timestamp"), startOfDay),
          q.lt(q.field("timestamp"), startOfDay + 86400000)
        )
      )
      .filter((q) => q.eq((q.field("payload") as unknown as { goalId: string }), goalId))
      .first();
    return event !== null;
  },
});

// Returns all constructing buildings with their island's agents
export const getConstructingBuildings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const buildings = await ctx.db
      .query("buildings")
      .filter((q) => q.eq(q.field("state"), "constructing"))
      .collect();

    const results = [];
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

// Returns all active islands with their members (user phone numbers) and last 7 days of events
export const getIslandsForWeeklySummary = internalQuery({
  args: {},
  handler: async (ctx) => {
    const islands = await ctx.db
      .query("islands")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const since = Date.now() - 7 * 86400000;
    const results = [];

    for (const island of islands) {
      const members = await ctx.db
        .query("islandMembers")
        .withIndex("by_island", (q) => q.eq("islandId", island._id))
        .collect();

      const phones: string[] = [];
      for (const m of members) {
        const user = await ctx.db.get(m.userId);
        if (user) phones.push(user.phoneNumber);
      }

      const events = await ctx.db
        .query("events")
        .withIndex("by_island_timestamp", (q) =>
          q.eq("islandId", island._id).gte("timestamp", since)
        )
        .collect();

      results.push({ island, phones, events });
    }

    return results;
  },
});

// Get phone numbers for all members of an island
export const getIslandPhoneNumbers = internalQuery({
  args: { islandId: v.id("islands") },
  handler: async (ctx, { islandId }) => {
    const members = await ctx.db
      .query("islandMembers")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .collect();
    const phones: string[] = [];
    for (const m of members) {
      const user = await ctx.db.get(m.userId);
      if (user) phones.push(user.phoneNumber);
    }
    return phones;
  },
});
