import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phoneNumber: v.string(),
    displayName: v.string(),
    timezone: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.number(),
  }).index("by_phone", ["phoneNumber"]),

  islands: defineTable({
    name: v.string(),
    tier: v.number(),
    islandLevel: v.number(),
    xp: v.number(),
    currency: v.number(),
    difficulty: v.union(v.literal("easy"), v.literal("normal"), v.literal("hard")),
    gridSize: v.object({ width: v.number(), height: v.number() }),
    status: v.union(v.literal("active"), v.literal("ascended")),
    createdAt: v.number(),
    ascendedAt: v.optional(v.number()),
  }),

  islandMembers: defineTable({
    islandId: v.id("islands"),
    userId: v.id("users"),
    joinedAt: v.number(),
    role: v.union(v.literal("creator"), v.literal("member")),
  })
    .index("by_island", ["islandId"])
    .index("by_user", ["userId"])
    .index("by_island_user", ["islandId", "userId"]),

  agents: defineTable({
    islandId: v.id("islands"),
    userId: v.id("users"),
    personalityProfile: v.any(),
    motivation: v.number(),
    reminderVariants: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_island", ["islandId"])
    .index("by_island_user", ["islandId", "userId"]),

  goals: defineTable({
    islandId: v.id("islands"),
    userId: v.id("users"),
    text: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
    parentGoalId: v.optional(v.id("goals")),
  })
    .index("by_island_user", ["islandId", "userId"])
    .index("by_user_status", ["userId", "status"]),

  checkIns: defineTable({
    goalId: v.id("goals"),
    userId: v.id("users"),
    islandId: v.id("islands"),
    date: v.string(), // YYYY-MM-DD
    completed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_goal_date", ["goalId", "date"])
    .index("by_island_date", ["islandId", "date"])
    .index("by_user_date", ["userId", "date"]),

  buildings: defineTable({
    islandId: v.id("islands"),
    type: v.string(),
    gridX: v.number(),
    gridY: v.number(),
    footprint: v.object({ width: v.number(), height: v.number() }),
    state: v.union(
      v.literal("constructing"),
      v.literal("complete"),
      v.literal("damaged")
    ),
    buildProgress: v.number(), // 0-1
    buildTimeDays: v.number(),
    costPaid: v.number(),
    placedBy: v.id("users"),
    placedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_island", ["islandId"]),

  events: defineTable({
    islandId: v.id("islands"),
    type: v.union(
      v.literal("check_in"),
      v.literal("miss"),
      v.literal("build_placed"),
      v.literal("build_complete"),
      v.literal("damage"),
      v.literal("repair"),
      v.literal("agent_message"),
      v.literal("weekly_summary"),
      v.literal("ascension"),
      v.literal("goal_add"),
      v.literal("goal_edit"),
      v.literal("goal_delete")
    ),
    payload: v.any(),
    timestamp: v.number(),
  })
    .index("by_island", ["islandId"])
    .index("by_island_timestamp", ["islandId", "timestamp"]),

  aiMessages: defineTable({
    agentId: v.id("agents"),
    channel: v.union(
      v.literal("imessage_personal"),
      v.literal("imessage_group")
    ),
    content: v.string(),
    context: v.optional(v.any()),
    sentAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_agent_sent", ["agentId", "sentAt"]),
});
