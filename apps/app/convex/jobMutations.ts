import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logAiMessage = mutation({
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

export const recordMiss = mutation({
  args: {
    goalId: v.id("goals"),
    phoneNumber: v.string(),
    islandId: v.id("islands"),
    agentId: v.id("agents"),
    newMotivation: v.number(),
    date: v.string(),
  },
  handler: async (ctx, { goalId, phoneNumber, islandId, agentId, newMotivation, date }) => {
    await ctx.db.insert("checkIns", {
      goalId,
      phoneNumber,
      islandId,
      date,
      completed: false,
      createdAt: Date.now(),
    });
    await ctx.db.insert("events", {
      islandId,
      type: "miss",
      payload: { goalId, phoneNumber },
      timestamp: Date.now(),
    });
    await ctx.db.patch(agentId, { motivation: newMotivation });
  },
});

export const damageConstructingBuilding = mutation({
  args: { islandId: v.id("islands"), phoneNumber: v.string() },
  handler: async (ctx, { islandId, phoneNumber }) => {
    const building = await ctx.db
      .query("buildings")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .filter((q) =>
        q.and(
          q.eq(q.field("state"), "constructing"),
          q.eq(q.field("placedBy"), phoneNumber)
        )
      )
      .first();
    if (!building) return;

    await ctx.db.patch(building._id, { state: "damaged" });
    await ctx.db.insert("events", {
      islandId,
      type: "damage",
      payload: { buildingId: building._id, phoneNumber },
      timestamp: Date.now(),
    });
  },
});

export const advanceBuildProgress = mutation({
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

export const recordWeeklySummary = mutation({
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
    // Embed islandId in the aiMessages context so the client digest query
    // can filter messages per island without a dedicated index.
    await ctx.db.insert("aiMessages", {
      agentId,
      channel: "imessage_group",
      content,
      context: { ...(stats ?? {}), islandId },
      sentAt: Date.now(),
    });
    // Mark this week as handled so islandsReadyForWeeklySummary skips it
    // until the next multiple-of-7 boundary.
    const island = await ctx.db.get(islandId);
    if (island) {
      await ctx.db.patch(islandId, {
        lastWeeklySummaryDayCount: island.dayCount ?? 0,
      });
    }
  },
});
