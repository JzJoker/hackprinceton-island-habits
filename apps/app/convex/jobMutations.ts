import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const logAiMessage = internalMutation({
  args: {
    agentId: v.id("agents"),
    channel: v.union(v.literal("imessage_personal"), v.literal("imessage_group")),
    content: v.string(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, { agentId, channel, content, context }) => {
    await ctx.db.insert("aiMessages", {
      agentId,
      channel,
      content,
      context,
      sentAt: Date.now(),
    });
  },
});

export const recordMiss = internalMutation({
  args: {
    goalId: v.id("goals"),
    userId: v.id("users"),
    islandId: v.id("islands"),
    agentId: v.id("agents"),
    newMotivation: v.number(),
    date: v.string(),
  },
  handler: async (ctx, { goalId, userId, islandId, agentId, newMotivation, date }) => {
    await ctx.db.insert("checkIns", {
      goalId,
      userId,
      islandId,
      date,
      completed: false,
      createdAt: Date.now(),
    });
    await ctx.db.insert("events", {
      islandId,
      type: "miss",
      payload: { goalId, userId },
      timestamp: Date.now(),
    });
    await ctx.db.patch(agentId, { motivation: newMotivation });
  },
});

export const damageConstructingBuilding = internalMutation({
  args: { islandId: v.id("islands"), userId: v.id("users") },
  handler: async (ctx, { islandId, userId }) => {
    const building = await ctx.db
      .query("buildings")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .filter((q) =>
        q.and(
          q.eq(q.field("state"), "constructing"),
          q.eq(q.field("placedBy"), userId)
        )
      )
      .first();
    if (!building) return;

    await ctx.db.patch(building._id, { state: "damaged" });
    await ctx.db.insert("events", {
      islandId,
      type: "damage",
      payload: { buildingId: building._id, userId },
      timestamp: Date.now(),
    });
  },
});

export const advanceBuildProgress = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    newProgress: v.number(),
    isComplete: v.boolean(),
  },
  handler: async (ctx, { buildingId, newProgress, isComplete }) => {
    const building = await ctx.db.get(buildingId);
    if (!building) return;

    if (isComplete) {
      await ctx.db.patch(buildingId, {
        buildProgress: 1,
        state: "complete",
        completedAt: Date.now(),
      });
      await ctx.db.insert("events", {
        islandId: building.islandId,
        type: "build_complete",
        payload: { buildingId, type: building.type },
        timestamp: Date.now(),
      });
    } else {
      await ctx.db.patch(buildingId, { buildProgress: newProgress });
    }
  },
});

export const recordWeeklySummary = internalMutation({
  args: {
    islandId: v.id("islands"),
    agentId: v.id("agents"),
    content: v.string(),
    stats: v.any(),
  },
  handler: async (ctx, { islandId, agentId, content, stats }) => {
    await ctx.db.insert("events", {
      islandId,
      type: "weekly_summary",
      payload: { content, stats },
      timestamp: Date.now(),
    });
    await ctx.db.insert("aiMessages", {
      agentId,
      channel: "imessage_group",
      content,
      context: stats,
      sentAt: Date.now(),
    });
  },
});
