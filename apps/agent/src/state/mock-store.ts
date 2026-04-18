export type Personality = "optimist" | "stoic" | "anxious" | "humorous" | "dreamer";

export type MockUser = {
  userId: string;
  phone: string;
  displayName: string;
};

export type MockAgent = {
  agentId: string;
  userId: string;
  islandId: string;
  personality: Personality;
  motivation: number;
  reminderVariants: string[];
};

export type MockGoal = {
  goalId: string;
  userId: string;
  islandId: string;
  text: string;
  status: "active" | "archived";
};

export type MockIsland = {
  islandId: string;
  name: string;
  tier: number;
  level: number;
  xp: number;
  currency: number;
  groupSpaceId: string | null;
  memberUserIds: string[];
};

export type WeekStats = {
  goalsCompleted: number;
  goalsMissed: number;
  buildingsCompleted: number;
  buildingsDamaged: number;
  avgMotivation: number;
  xpGained: number;
  topCompleter: string;
  topMisser: string;
};

const users: Record<string, MockUser> = {
  "u_alex": { userId: "u_alex", phone: "+15551110001", displayName: "Alex" },
  "u_sam":  { userId: "u_sam",  phone: "+15551110002", displayName: "Sam" },
  "u_jess": { userId: "u_jess", phone: "+15551110003", displayName: "Jess" },
};

const agents: Record<string, MockAgent> = {
  "a_alex": {
    agentId: "a_alex", userId: "u_alex", islandId: "isl_demo",
    personality: "optimist", motivation: 82,
    reminderVariants: [
      "Morning Alex! Today's the day for that gym run — let's go!",
      "Hey, sunshine. Weights are waiting. You've got this.",
      "Pop quiz: who's about to crush their workout? You.",
    ],
  },
  "a_sam": {
    agentId: "a_sam", userId: "u_sam", islandId: "isl_demo",
    personality: "stoic", motivation: 24,
    reminderVariants: [
      "Read 20 pages today.",
      "Books open. Begin.",
      "20 pages. No excuses.",
    ],
  },
  "a_jess": {
    agentId: "a_jess", userId: "u_jess", islandId: "isl_demo",
    personality: "anxious", motivation: 55,
    reminderVariants: [
      "Hey um, journaling time? Maybe? Sorry to bug you.",
      "I know you're busy but... 5 minutes of journaling?",
      "Don't forget to journal! (Please?)",
    ],
  },
};

const goals: Record<string, MockGoal> = {
  "g_alex": { goalId: "g_alex", userId: "u_alex", islandId: "isl_demo", text: "Gym 4x/week", status: "active" },
  "g_sam":  { goalId: "g_sam",  userId: "u_sam",  islandId: "isl_demo", text: "Read 20 pages/day", status: "active" },
  "g_jess": { goalId: "g_jess", userId: "u_jess", islandId: "isl_demo", text: "Journal daily",     status: "active" },
};

const islands: Record<string, MockIsland> = {
  "isl_demo": {
    islandId: "isl_demo",
    name: "First Light",
    tier: 1,
    level: 7,
    xp: 124,
    currency: 240,
    groupSpaceId: null,
    memberUserIds: ["u_alex", "u_sam", "u_jess"],
  },
};

export function getUser(userId: string): MockUser | undefined {
  return users[userId];
}

export function getUserByPhone(phone: string): MockUser | undefined {
  return Object.values(users).find((u) => u.phone === phone);
}

export function getAgentForUser(userId: string, islandId: string): MockAgent | undefined {
  return Object.values(agents).find((a) => a.userId === userId && a.islandId === islandId);
}

export function getAgentsForIsland(islandId: string): MockAgent[] {
  return Object.values(agents).filter((a) => a.islandId === islandId);
}

export function getGoalsForUser(userId: string, islandId: string): MockGoal[] {
  return Object.values(goals).filter((g) => g.userId === userId && g.islandId === islandId && g.status === "active");
}

export function getIsland(islandId: string): MockIsland | undefined {
  return islands[islandId];
}

export function setIslandGroupSpace(islandId: string, spaceId: string): void {
  const island = islands[islandId];
  if (island) island.groupSpaceId = spaceId;
}

export function setMotivation(agentId: string, motivation: number): void {
  const agent = agents[agentId];
  if (agent) agent.motivation = Math.max(0, Math.min(100, motivation));
}

export function setUserPhone(userId: string, phone: string): void {
  const user = users[userId];
  if (user) user.phone = phone;
}

export function overrideMemberPhones(islandId: string, phones: string[]): void {
  const island = islands[islandId];
  if (!island) return;
  island.memberUserIds.slice(0, phones.length).forEach((uid, i) => {
    setUserPhone(uid, phones[i]!);
  });
}

export function setIslandLevel(islandId: string, level: number): void {
  const island = islands[islandId];
  if (island) island.level = level;
}

export function fakeWeekStats(islandId: string): WeekStats {
  const _ = islandId;
  return {
    goalsCompleted: 18,
    goalsMissed: 5,
    buildingsCompleted: 2,
    buildingsDamaged: 1,
    avgMotivation: 64,
    xpGained: 18,
    topCompleter: "Alex",
    topMisser: "Sam",
  };
}
