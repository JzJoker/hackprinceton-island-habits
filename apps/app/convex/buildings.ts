import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getBuildings = query({
  args: { islandId: v.id("islands") },
  handler: async (ctx, { islandId }) =>
    ctx.db
      .query("buildings")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .collect(),
});

export const tickBuildProgress = mutation({
  args: { islandId: v.id("islands"), motivationFactor: v.number() },
  handler: async (ctx, { islandId, motivationFactor }) => {
    const INTERVAL_SECS = 5;
    const GAME_DAY_SECS = 120;
    const buildings = await ctx.db
      .query("buildings")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .filter((q) => q.neq(q.field("state"), "complete"))
      .collect();
    for (const b of buildings) {
      const rate = motivationFactor / (Math.max(1, b.buildTimeDays) * GAME_DAY_SECS);
      const newProgress = Math.min(1, b.buildProgress + rate * INTERVAL_SECS);
      const isComplete = newProgress >= 1;
      await ctx.db.patch(b._id, {
        buildProgress: newProgress,
        state: isComplete ? "complete" : b.state,
        ...(isComplete ? { completedAt: Date.now() } : {}),
      });
      if (isComplete) {
        await ctx.db.insert("events", {
          islandId,
          type: "build_complete",
          payload: { buildingId: b._id, type: b.type },
          timestamp: Date.now(),
        });
      }
    }
  },
});

export const placeBuilding = mutation({
  args: {
    islandId: v.id("islands"),
    type: v.string(),
    gridX: v.number(),
    gridY: v.number(),
    costPaid: v.number(),
    placedBy: v.string(),
    buildTimeDays: v.number(),
  },
  handler: async (ctx, args) => {
    const island = await ctx.db.get(args.islandId);
    if (!island) throw new Error("Island not found");
    if ((island.currency ?? 0) < args.costPaid) {
      throw new Error("Not enough currency");
    }
    const id = await ctx.db.insert("buildings", {
      ...args,
      footprint: { width: 1, height: 1 },
      state: "constructing",
      buildProgress: 0,
      placedAt: Date.now(),
    });
    await ctx.db.patch(args.islandId, {
      currency: (island.currency ?? 0) - args.costPaid,
    });
    return id;
  },
});
