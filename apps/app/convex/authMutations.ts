import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastLoginAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      phoneNumber,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });
  },
});

export const createSession = mutation({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, { token, userId }) => {
    await ctx.db.insert("sessions", {
      token,
      userId,
      createdAt: Date.now(),
    });
  },
});
