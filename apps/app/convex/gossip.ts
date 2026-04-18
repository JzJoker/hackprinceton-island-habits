import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveConversation = mutation({
  args: {
    islandId: v.id("islands"),
    agentAPhone: v.string(),
    agentBPhone: v.string(),
    lines: v.array(v.object({ speaker: v.string(), text: v.string() })),
    timestamp: v.number(),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("gossipConversations", args);
  },
});

export const getGossipHistory = query({
  args: { islandId: v.id("islands") },
  handler: async (ctx, { islandId }) => {
    return ctx.db
      .query("gossipConversations")
      .withIndex("by_island", (q) => q.eq("islandId", islandId))
      .order("desc")
      .take(20);
  },
});
