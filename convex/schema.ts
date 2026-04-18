import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  islands: defineTable({
    code: v.string(), // Unique game code (4-6 chars)
    name: v.string(),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("ascended")),
    tier: v.number(), // Starting at 1
    islandLevel: v.number(),
    xp: v.number(),
    currency: v.number(),
    difficulty: v.union(v.literal("easy"), v.literal("normal"), v.literal("hard")),
    gridSize: v.object({
      width: v.number(),
      height: v.number(),
    }),
    phoneNumbers: v.array(v.string()), // Group member phone numbers from Photon
    createdAt: v.number(),
    ascendedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"]),

  users: defineTable({
    phoneNumber: v.string(),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_phone", ["phoneNumber"]),

  islandMembers: defineTable({
    islandId: v.id("islands"),
    phoneNumber: v.string(),
    joinedAt: v.number(),
    role: v.union(v.literal("creator"), v.literal("member")),
  })
    .index("by_island", ["islandId"])
    .index("by_island_phone", ["islandId", "phoneNumber"]),

  agents: defineTable({
    islandId: v.id("islands"),
    phoneNumber: v.string(),
    personalityProfile: v.string(), // JSON or text description
    motivation: v.number(), // 0-100
    reminderVariants: v.array(v.string()), // Pre-generated reminders
    createdAt: v.number(),
  })
    .index("by_island", ["islandId"])
    .index("by_island_phone", ["islandId", "phoneNumber"]),

  goals: defineTable({
    islandId: v.id("islands"),
    phoneNumber: v.string(),
    text: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
    parentGoalId: v.optional(v.id("goals")), // For edited versions
  })
    .index("by_island", ["islandId"])
    .index("by_island_phone", ["islandId", "phoneNumber"]),

  checkIns: defineTable({
    goalId: v.id("goals"),
    phoneNumber: v.string(),
    islandId: v.id("islands"),
    date: v.string(), // YYYY-MM-DD
    completed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_goal", ["goalId"])
    .index("by_island_date", ["islandId", "date"]),

  buildings: defineTable({
    islandId: v.id("islands"),
    type: v.string(),
    gridX: v.number(),
    gridY: v.number(),
    footprint: v.object({
      width: v.number(),
      height: v.number(),
    }),
    state: v.union(v.literal("constructing"), v.literal("complete"), v.literal("damaged")),
    buildProgress: v.number(), // 0-1
    costPaid: v.number(),
    placedBy: v.string(), // phoneNumber
    placedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_island", ["islandId"]),

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
    payload: v.any(), // Flexible JSON
    timestamp: v.number(),
  })
    .index("by_island", ["islandId"]),

  aiMessages: defineTable({
    agentId: v.id("agents"),
    channel: v.union(v.literal("imessage_personal"), v.literal("imessage_group")),
    content: v.string(),
    context: v.optional(v.string()),
    sentAt: v.number(),
  })
    .index("by_agent", ["agentId"]),
});
