import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Create agent personality for a user on an island
export const createAgent = mutation({
  args: {
    islandId: v.id("islands"),
    phoneNumber: v.string(),
    goals: v.array(v.string()),
  },
  async handler(ctx, args) {
    // TODO: Call K2 Think V2 to generate personality
    // For now, use a placeholder personality
    const personality = `A helpful island companion committed to supporting your goals: ${args.goals.join(", ")}`;
    
    const agentId = await ctx.db.insert("agents", {
      islandId: args.islandId,
      phoneNumber: args.phoneNumber,
      personalityProfile: personality,
      motivation: 100,
      reminderVariants: [
        "Good morning! Time to tackle your goals!",
        "Let's make today productive!",
        "You've got this! Get started on your goals.",
        "Rise and shine! Ready to make a difference?",
        "Another day, another chance to grow!",
      ],
      createdAt: Date.now(),
    });

    return await ctx.db.get(agentId);
  },
});

// Update agent motivation
export const updateMotivation = mutation({
  args: {
    agentId: v.id("agents"),
    delta: v.number(), // positive or negative
  },
  async handler(ctx, args) {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const newMotivation = Math.max(0, Math.min(100, agent.motivation + args.delta));
    await ctx.db.patch(args.agentId, { motivation: newMotivation });
    return newMotivation;
  },
});
