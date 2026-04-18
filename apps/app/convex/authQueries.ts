import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getSession = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!session) return null;
    return { userId: session.userId };
  },
});
