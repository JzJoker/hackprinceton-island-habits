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
    const id = await ctx.db.insert("buildings", {
      ...args,
      footprint: { width: 1, height: 1 },
      state: "constructing",
      buildProgress: 0,
      placedAt: Date.now(),
    });
    const island = await ctx.db.get(args.islandId);
    if (island) {
      await ctx.db.patch(args.islandId, {
        currency: Math.max(0, (island.currency ?? 0) - args.costPaid),
      });
    }
    return id;
  },
});
