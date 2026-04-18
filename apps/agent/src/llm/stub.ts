import type { Personality, WeekStats } from "../state/mock-store.js";

export type GoalChangeKind = "add" | "edit" | "delete";

const VOICE: Record<Personality, (msg: string) => string> = {
  optimist: (m) => m,
  stoic: (m) => m.split(/[.!?]\s*/).slice(0, 2).join(". ").trim(),
  anxious: (m) => `Sorry, but... ${m.toLowerCase()} (is that ok?)`,
  humorous: (m) => `${m} (don't make me cry, please.)`,
  dreamer: (m) => `${m} The clouds are watching.`,
};

function flavor(p: Personality, msg: string): string {
  return VOICE[p](msg);
}

export function generatePersonality(displayName: string, goalText: string): {
  personality: Personality;
  bio: string;
} {
  const pool: Personality[] = ["optimist", "stoic", "anxious", "humorous", "dreamer"];
  const personality = pool[Math.floor(Math.random() * pool.length)]!;
  const bio = `${displayName}'s agent — ${personality} — keeping watch over "${goalText}".`;
  return { personality, bio };
}

export function generateReminderVariants(personality: Personality, goalText: string, count = 3): string[] {
  const seeds = [
    `Time for ${goalText} today.`,
    `Don't forget: ${goalText}.`,
    `Quick nudge — ${goalText} is on the list.`,
    `One small step: ${goalText}.`,
  ];
  return seeds.slice(0, count).map((s) => flavor(personality, s));
}

export function generateMorningReminder(personality: Personality, goalText: string): string {
  return flavor(personality, `Morning! ${goalText} is waiting.`);
}

export function generateLowMotivationMessage(personality: Personality, displayName: string): string {
  const base = `${displayName} is slipping. The island feels it.`;
  return flavor(personality, base);
}

export function generateGoalChangeMessage(
  personality: Personality,
  displayName: string,
  kind: GoalChangeKind,
  goalText: string,
): string {
  const base =
    kind === "add"   ? `${displayName} just added "${goalText}".` :
    kind === "edit"  ? `${displayName} reshaped "${goalText}".` :
                       `${displayName} let go of "${goalText}".`;
  return flavor(personality, base);
}

export function generateWeeklySummary(islandName: string, stats: WeekStats): string {
  const ratio = stats.goalsCompleted / Math.max(1, stats.goalsCompleted + stats.goalsMissed);
  const tone =
    ratio > 0.8 ? "proud" :
    ratio > 0.5 ? "calm" :
                  "gentle";
  return [
    `[${islandName}] (${tone})`,
    `${stats.goalsCompleted} goals kept, ${stats.goalsMissed} missed.`,
    `${stats.buildingsCompleted} structures rose, ${stats.buildingsDamaged} cracked.`,
    `Avg motivation ${stats.avgMotivation}. +${stats.xpGained} XP.`,
    `Top: ${stats.topCompleter}. Sliding: ${stats.topMisser}.`,
  ].join(" ");
}

export function generateMonumentDescription(islandName: string, level: number): string {
  return `[${islandName}] A monument rises at level ${level} — etched with the days you stayed.`;
}

export function generateAscensionNarrative(islandName: string, daysLived: number, totalGoals: number): string {
  return `[${islandName}] ascends. ${daysLived} days, ${totalGoals} goals kept. A new shore waits.`;
}
