import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a random alphanumeric code (4-6 chars)
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new island with a game code
export const createIsland = mutation({
  args: {
    phoneNumbers: v.array(v.string()), // Can contain phone numbers or emails
  },
  async handler(ctx, args) {
    let code = generateCode();
    // Ensure code uniqueness
    let existing = await ctx.db
      .query("islands")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    while (existing) {
      code = generateCode();
      existing = await ctx.db
        .query("islands")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }
    const islandId = await ctx.db.insert("islands", {
      code,
      name: `Island ${code}`,
      status: "onboarding",
      tier: 1,
      islandLevel: 0,
      xp: 0,
      currency: 300,
      difficulty: "normal",
      gridSize: {
        width: 10,
        height: 10,
      },
      phoneNumbers: args.phoneNumbers,
      createdAt: Date.now(),
    });

    // Add all participants (phone numbers or emails) as island members
    for (const participant of args.phoneNumbers) {
      await ctx.db.insert("islandMembers", {
        islandId,
        phoneNumber: participant, // Can be either phone number or email
        joinedAt: Date.now(),
        role: participant === args.phoneNumbers[0] ? "creator" : "member",
      });
    }

    return { islandId, code };
  },
});

// Get island by code
export const getIslandByCode = query({
  args: {
    code: v.string(),
  },
  async handler(ctx, args) {
    const island = await ctx.db
      .query("islands")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    return island;
  },
});

// Get island details (with members and agents)
export const getIslandDetails = query({
  args: {
    islandId: v.id("islands"),
  },
  async handler(ctx, args) {
    const island = await ctx.db.get(args.islandId);
    if (!island) {
      throw new Error("Island not found");
    }

    const members = await ctx.db
      .query("islandMembers")
      .withIndex("by_island", (q) => q.eq("islandId", args.islandId))
      .collect();

    const agents = await ctx.db
      .query("agents")
      .withIndex("by_island", (q) => q.eq("islandId", args.islandId))
      .collect();

    return { island, members, agents };
  },
});

// Join an island (add current phone as island member)
export const joinIsland = mutation({
  args: {
    islandId: v.id("islands"),
    phoneNumber: v.string(),
  },
  async handler(ctx, args) {
    // Check if already a member
    const existing = await ctx.db
      .query("islandMembers")
      .withIndex("by_island_phone", (q) =>
        q.eq("islandId", args.islandId).eq("phoneNumber", args.phoneNumber)
      )
      .first();

    if (existing) {
      return existing;
    }

    // Add as member
    const memberId = await ctx.db.insert("islandMembers", {
      islandId: args.islandId,
      phoneNumber: args.phoneNumber,
      joinedAt: Date.now(),
      role: "member",
    });

    // Keep denormalized phoneNumbers array in sync
    const island = await ctx.db.get(args.islandId);
    if (island && !island.phoneNumbers.includes(args.phoneNumber)) {
      await ctx.db.patch(args.islandId, {
        phoneNumbers: [...island.phoneNumbers, args.phoneNumber],
      });
    }

    return await ctx.db.get(memberId);
  },
});

// Mark island as active (all players have completed onboarding)
export const activateIsland = mutation({
  args: {
    islandId: v.id("islands"),
  },
  async handler(ctx, args) {
    const island = await ctx.db.get(args.islandId);
    if (!island) {
      throw new Error("Island not found");
    }

    await ctx.db.patch(args.islandId, { status: "active" });
    return true;
  },
});

// Get all islands for a phone number (or email)
export const getIslandsByPhone = query({
  args: {
    phoneNumber: v.string(),
  },
  async handler(ctx, args) {
    const members = await ctx.db
      .query("islandMembers")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .collect();

    const islands = [];
    for (const member of members) {
      const island = await ctx.db.get(member.islandId);
      if (island) {
        islands.push(island);
      }
    }

    return islands;
  },
});
