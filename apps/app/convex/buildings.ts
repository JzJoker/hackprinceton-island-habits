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
    const now = Date.now();
    const island = await ctx.db.get(islandId);
    if (!island) throw new Error("Island not found");

    // Prevent multi-tab clients from accelerating build progression.
    const minIntervalMs = INTERVAL_SECS * 1000 - 250;
    const lastTickAt = island.lastBuildTickAt ?? 0;
    if (now - lastTickAt < minIntervalMs) {
      return;
    }
    await ctx.db.patch(islandId, { lastBuildTickAt: now });

    const normalizedMotivation = Math.max(0, Math.min(1, motivationFactor));
    const buildings = await ctx.db
      .query("buildings")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .filter((q) => q.neq(q.field("state"), "complete"))
      .collect();
    for (const b of buildings) {
      const rate = normalizedMotivation / (Math.max(1, b.buildTimeDays) * GAME_DAY_SECS);
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
    let availableCurrency = island.currency ?? 0;

    // Back-compat for older islands created before starter currency existed.
    // Grant one-time starter funds only for brand-new, empty islands.
    const hasAnyBuildings = await ctx.db
      .query("buildings")
      .withIndex("by_island", (q) => q.eq("islandId", args.islandId))
      .first();
    if (!hasAnyBuildings && availableCurrency === 0) {
      availableCurrency = 300;
    }
    const id = await ctx.db.insert("buildings", {
      ...args,
      footprint: { width: 1, height: 1 },
      state: "constructing",
      buildProgress: 0,
      placedAt: Date.now(),
      placedAtEra: island.era ?? 0,
    });
    // Keep persistence/sync resilient: never reject placement due to
    // stale client-side economy state. Clamp server currency at zero.
    await ctx.db.patch(args.islandId, {
      currency: Math.max(0, availableCurrency - args.costPaid),
    });
    return id;
  },
});
