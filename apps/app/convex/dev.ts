import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

async function patchAgentMood(
  ctx: MutationCtx,
  islandId: Id<"islands">,
  phoneNumber: string | undefined,
  delta: number,
) {
  if (!phoneNumber) return;
  const agent = await ctx.db
    .query("agents")
    .withIndex("by_island_phone", (q) =>
      q.eq("islandId", islandId).eq("phoneNumber", phoneNumber),
    )
    .first();
  if (!agent) return;
  await ctx.db.patch(agent._id, {
    motivation: clamp(agent.motivation + delta, 0, 100),
  });
}

async function getIslandMotivationFactor(
  ctx: MutationCtx,
  islandId: Id<"islands">,
): Promise<number> {
  const agents = await ctx.db
    .query("agents")
    .withIndex("by_island", (q) => q.eq("islandId", islandId))
    .collect();
  if (!agents.length) return 0;
  const avgMood = agents.reduce((sum, agent) => sum + agent.motivation, 0) / agents.length;
  return clamp((avgMood - 20) / 80, 0, 1);
}

async function advanceConstructingBuildingsByDays(
  ctx: MutationCtx,
  islandId: Id<"islands">,
  motivationFactor: number,
  days: number,
) {
  if (days <= 0 || motivationFactor <= 0) return;
  const buildings = await ctx.db
    .query("buildings")
    .withIndex("by_island", (q) => q.eq("islandId", islandId))
    .filter((q) => q.eq(q.field("state"), "constructing"))
    .collect();

  for (const building of buildings) {
    const dailyRate = motivationFactor / Math.max(1, building.buildTimeDays);
    const newProgress = clamp(building.buildProgress + dailyRate * days, 0, 1);
    const isComplete = newProgress >= 1 && building.buildProgress < 1;
    await ctx.db.patch(building._id, {
      buildProgress: newProgress,
      ...(isComplete ? { state: "complete", completedAt: Date.now() } : {}),
    });
    if (isComplete) {
      await ctx.db.insert("events", {
        islandId,
        type: "build_complete",
        payload: { buildingId: building._id, type: building.type },
        timestamp: Date.now(),
      });
    }
  }
}

// Reward per completed goal — matches per-check-in rate in goals.checkIn
// (currency +10, xp +1) so a full good day pays out as if every active goal
// of the user had been checked in once.
const GOAL_REWARD_CURRENCY = 10;
const GOAL_REWARD_XP = 1;

async function countActiveGoalsForUser(
  ctx: MutationCtx,
  islandId: Id<"islands">,
  phoneNumber: string | undefined,
): Promise<number> {
  if (!phoneNumber) return 0;
  const goals = await ctx.db
    .query("goals")
    .withIndex("by_island_phone", (q) =>
      q.eq("islandId", islandId).eq("phoneNumber", phoneNumber),
    )
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();
  return goals.length;
}

export const goodDay = mutation({
  args: {
    islandId: v.id("islands"),
    phoneNumber: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const island = await ctx.db.get(args.islandId);
    if (!island) throw new Error("Island not found");

    const goalCount = await countActiveGoalsForUser(
      ctx,
      args.islandId,
      args.phoneNumber,
    );
    const currencyReward = goalCount * GOAL_REWARD_CURRENCY;
    const xpReward = goalCount * GOAL_REWARD_XP;
    const nextXp = (island.xp ?? 0) + xpReward;

    await ctx.db.patch(args.islandId, {
      currency: (island.currency ?? 0) + currencyReward,
      xp: nextXp,
      islandLevel: Math.floor(nextXp / 20),
      streakDays: Math.max(1, (island.streakDays ?? 0) + 1),
      dayCount: (island.dayCount ?? 1) + 1,
    });

    await patchAgentMood(ctx, args.islandId, args.phoneNumber, 8);
    const motivationFactor = await getIslandMotivationFactor(ctx, args.islandId);
    await advanceConstructingBuildingsByDays(ctx, args.islandId, motivationFactor, 1);
    return { ok: true, goalCount, currencyReward, xpReward };
  },
});

export const badDay = mutation({
  args: {
    islandId: v.id("islands"),
    phoneNumber: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const island = await ctx.db.get(args.islandId);
    if (!island) throw new Error("Island not found");

    await ctx.db.patch(args.islandId, {
      streakDays: 0,
      dayCount: (island.dayCount ?? 1) + 1,
    });

    await patchAgentMood(ctx, args.islandId, args.phoneNumber, -15);
    const motivationFactor = await getIslandMotivationFactor(ctx, args.islandId);
    await advanceConstructingBuildingsByDays(ctx, args.islandId, motivationFactor, 1);
    return { ok: true };
  },
});

export const levelUp = mutation({
  args: {
    islandId: v.id("islands"),
  },
  async handler(ctx, args) {
    const island = await ctx.db.get(args.islandId);
    if (!island) throw new Error("Island not found");

    const nextLevel = (island.islandLevel ?? 0) + 1;
    await ctx.db.patch(args.islandId, {
      islandLevel: nextLevel,
      // Keep XP progress bar at 0% for the new level.
      xp: nextLevel * 20,
    });
    return { ok: true };
  },
});
