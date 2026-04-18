import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add goals for a user on an island
export const addGoals = mutation({
  args: {
    islandId: v.id("islands"),
    phoneNumber: v.string(),
    goals: v.array(v.string()),
  },
  async handler(ctx, args) {
    const goalIds: string[] = [];

    for (const goalText of args.goals) {
      const goalId = await ctx.db.insert("goals", {
        islandId: args.islandId,
        phoneNumber: args.phoneNumber,
        text: goalText,
        status: "active",
        createdAt: Date.now(),
      });
      goalIds.push(goalId);
    }

    return goalIds;
  },
});

// Get all goals for a user on an island
export const getGoals = query({
  args: {
    islandId: v.id("islands"),
    phoneNumber: v.string(),
  },
  async handler(ctx, args) {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_island_phone", (q) =>
        q.eq("islandId", args.islandId).eq("phoneNumber", args.phoneNumber)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return goals;
  },
});

// Get all goals for an island
export const getIslandGoals = query({
  args: {
    islandId: v.id("islands"),
  },
  async handler(ctx, args) {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_island", (q) => q.eq("islandId", args.islandId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return goals;
  },
});

// Check in on a goal
export const checkIn = mutation({
  args: {
    goalId: v.id("goals"),
    islandId: v.id("islands"),
    phoneNumber: v.string(),
    date: v.string(), // YYYY-MM-DD
  },
  async handler(ctx, args) {
    // Check if already checked in today
    const existing = await ctx.db
      .query("checkIns")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .filter((q) =>
        q.and(
          q.eq(q.field("date"), args.date),
          q.eq(q.field("phoneNumber"), args.phoneNumber)
        )
      )
      .first();

    if (existing) {
      return existing;
    }

    // Create check-in
    const checkInId = await ctx.db.insert("checkIns", {
      goalId: args.goalId,
      phoneNumber: args.phoneNumber,
      islandId: args.islandId,
      date: args.date,
      completed: true,
      createdAt: Date.now(),
    });

    // Update island XP and currency
    const island = await ctx.db.get(args.islandId);
    if (island) {
      await ctx.db.patch(args.islandId, {
        xp: island.xp + 1,
        currency: island.currency + 10, // 10 currency per check-in
        islandLevel: Math.floor((island.xp + 1) / 20), // Simplified XP curve
      });
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_island_phone", (q) =>
        q.eq("islandId", args.islandId).eq("phoneNumber", args.phoneNumber)
      )
      .first();
    if (agent) {
      await ctx.db.patch(agent._id, {
        motivation: Math.min(100, agent.motivation + 1),
      });
    }

    return await ctx.db.get(checkInId);
  },
});

// Get today's check-ins for a user
export const getTodayCheckIns = query({
  args: {
    islandId: v.id("islands"),
    phoneNumber: v.string(),
    date: v.string(),
  },
  async handler(ctx, args) {
    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_island_date", (q) =>
        q.eq("islandId", args.islandId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("phoneNumber"), args.phoneNumber))
      .collect();

    return checkIns;
  },
});
