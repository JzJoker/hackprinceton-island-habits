import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import a1 from "@/assets/agent-1.png";
import a2 from "@/assets/agent-2.png";
import a3 from "@/assets/agent-3.png";
import a4 from "@/assets/agent-4.png";
import a5 from "@/assets/agent-5.png";

export type AgentId = "kael" | "theo" | "mei" | "jordan" | "sofia";
export type ScreenId = "island" | "build" | "chat" | "recap" | "history" | "checkin" | "expand" | "party" | null;
export type BuildingType = "house" | "garden" | "library" | "gym" | "lighthouse" | "fountain" | "bonfire" | "cabin" | "dock" | "shrine" | "windmill" | "treehouse";
export type DistrictId = "main" | "forest" | "beach" | "hill";

export const ISLAND_TIERS = [
  { era: 0, name: "Pine Hollow",    emoji: "🌿", environment: "spring",   unlockLevel: 0,  radius: 7.0,  fogColor: "#C8DFF0", skyTurbidity: 1.8, skyRayleigh: 0.8,  waterColor: "#3B8EBF", sunPos: [10,5,4] as [number,number,number], description: "Your first island — fresh grass and gentle breeze." },
  { era: 1, name: "Amber Ridge",    emoji: "🍂", environment: "autumn",   unlockLevel: 10, radius: 8.5,  fogColor: "#D4A882", skyTurbidity: 3.5, skyRayleigh: 0.4,  waterColor: "#4A7A9B", sunPos: [6,2,8]  as [number,number,number], description: "Golden harvest warmth. A bigger canvas awaits." },
  { era: 2, name: "Frostpeak Isle", emoji: "❄️", environment: "winter",   unlockLevel: 20, radius: 10.0, fogColor: "#C0D4E8", skyTurbidity: 0.8, skyRayleigh: 1.4,  waterColor: "#2A5878", sunPos: [4,3,10] as [number,number,number], description: "Snow-dusted peaks, crisp silence." },
  { era: 3, name: "Coral Cove",     emoji: "🌺", environment: "tropical", unlockLevel: 30, radius: 12.0, fogColor: "#A8D8E8", skyTurbidity: 1.2, skyRayleigh: 1.6,  waterColor: "#1A6B8B", sunPos: [8,8,2]  as [number,number,number], description: "Lush tropics, perpetual summer." },
] as const;
export type IslandEra = typeof ISLAND_TIERS[number];

export interface IslandSnapshot {
  era: number;
  name: string;
  emoji: string;
  buildings: Building[];
  level: number;
  coinsEarned: number;
  graduatedAt: string;
}

export interface Agent {
  id: AgentId;
  name: string;
  img: string;
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  hairStyle: "short" | "long" | "bun" | "cap";
  mood: number;
  line: string;
  goal: string;
  online: boolean;
  isYou?: boolean;
  home: [number, number];
}

export interface Building {
  id: string;
  type: BuildingType;
  pos: [number, number];
  rot?: number;
  district: DistrictId;
  score?: number;
}

export interface BuildOption {
  type: BuildingType;
  name: string;
  cost: number;
  radius: number;        // footprint radius in world units
  emoji: string;
  district: DistrictId;
  locked?: string | null;
  // Islanders-style placement scoring
  rules: {
    likes?: { type: BuildingType | "tree" | "rock" | "water" | "flower"; range: number; pts: number }[];
    dislikes?: { type: BuildingType | "tree" | "rock" | "water" | "flower"; range: number; pts: number }[];
  };
}

export const BUILD_LIBRARY: BuildOption[] = [
  { type: "house", name: "Cottage", cost: 120, radius: 0.55, emoji: "🏠", district: "main",
    rules: { likes: [{ type: "tree", range: 1.5, pts: 2 }, { type: "fountain", range: 2, pts: 4 }, { type: "garden", range: 1.5, pts: 3 }],
             dislikes: [{ type: "gym", range: 1.5, pts: -3 }, { type: "bonfire", range: 1.2, pts: -2 }] } },
  { type: "garden", name: "Garden", cost: 80, radius: 0.4, emoji: "🌷", district: "main",
    rules: { likes: [{ type: "house", range: 1.5, pts: 3 }, { type: "fountain", range: 2, pts: 5 }, { type: "tree", range: 1.5, pts: 2 }] } },
  { type: "library", name: "Library", cost: 240, radius: 0.7, emoji: "📚", district: "main",
    rules: { likes: [{ type: "tree", range: 2, pts: 3 }, { type: "garden", range: 2, pts: 4 }],
             dislikes: [{ type: "gym", range: 2, pts: -5 }, { type: "bonfire", range: 1.5, pts: -3 }] } },
  { type: "gym", name: "Gym hut", cost: 200, radius: 0.6, emoji: "🏋️", district: "main",
    rules: { likes: [{ type: "fountain", range: 2, pts: 3 }, { type: "rock", range: 1.5, pts: 2 }],
             dislikes: [{ type: "house", range: 1.5, pts: -3 }, { type: "library", range: 2, pts: -5 }] } },
  { type: "fountain", name: "Fountain", cost: 160, radius: 0.55, emoji: "⛲", district: "main",
    rules: { likes: [{ type: "house", range: 2, pts: 3 }, { type: "garden", range: 2, pts: 5 }, { type: "library", range: 2, pts: 3 }] } },
  { type: "bonfire", name: "Bonfire", cost: 60, radius: 0.4, emoji: "🔥", district: "main",
    rules: { likes: [{ type: "tree", range: 2, pts: 1 }],
             dislikes: [{ type: "house", range: 1.2, pts: -2 }, { type: "library", range: 1.5, pts: -3 }] } },
  { type: "lighthouse", name: "Lighthouse", cost: 800, radius: 0.7, emoji: "🗼", district: "beach", locked: "Reach Lv.15",
    rules: { likes: [{ type: "water", range: 3, pts: 8 }, { type: "dock", range: 2.5, pts: 4 }] } },
  { type: "cabin", name: "Forest cabin", cost: 180, radius: 0.55, emoji: "🛖", district: "forest",
    rules: { likes: [{ type: "tree", range: 1.5, pts: 4 }, { type: "cabin", range: 2.5, pts: 2 }] } },
  { type: "dock", name: "Wooden dock", cost: 140, radius: 0.6, emoji: "⚓", district: "beach",
    rules: { likes: [{ type: "water", range: 2, pts: 6 }] } },
  { type: "shrine", name: "Hill shrine", cost: 320, radius: 0.55, emoji: "⛩️", district: "hill",
    rules: { likes: [{ type: "tree", range: 2, pts: 3 }, { type: "rock", range: 2, pts: 3 }] } },
  { type: "windmill", name: "Windmill", cost: 360, radius: 0.65, emoji: "🌬️", district: "main",
    rules: { likes: [{ type: "garden", range: 2.5, pts: 5 }, { type: "house", range: 2.5, pts: 3 }],
             dislikes: [{ type: "library", range: 2, pts: -2 }] } },
  { type: "treehouse", name: "Treehouse", cost: 280, radius: 0.55, emoji: "🌳", district: "main",
    rules: { likes: [{ type: "tree", range: 1.2, pts: 6 }, { type: "flower", range: 1.5, pts: 2 }],
             dislikes: [{ type: "bonfire", range: 1.5, pts: -4 }] } },
];

export interface District {
  id: DistrictId;
  name: string;
  emoji: string;
  unlocked: boolean;
  unlockCost: number;
  unlockLevel: number;
  // World position of district center
  center: [number, number];
  radius: number;
  color: string;
  description: string;
}

export const DISTRICTS: District[] = [
  { id: "main",   name: "Pine Hollow",     emoji: "🏝️", unlocked: true,  unlockCost: 0,    unlockLevel: 0,  center: [0, 0],        radius: 7.0, color: "#7AB85A", description: "Your starting island — grass and gentle hills." },
  { id: "forest", name: "Whispering Wood", emoji: "🌲", unlocked: false, unlockCost: 600,  unlockLevel: 12, center: [-15.0, -2.5], radius: 5.0, color: "#3F7A3F", description: "Dense pines & moss. Unlocks forest cabins." },
  { id: "beach",  name: "Coral Cove",      emoji: "🏖️", unlocked: false, unlockCost: 900,  unlockLevel: 14, center: [14.5, 3.0],   radius: 5.2, color: "#EFD9A8", description: "Warm sand & shallow water. Unlocks docks & lighthouse." },
  { id: "hill",   name: "Stoneview Peak",  emoji: "⛰️", unlocked: false, unlockCost: 1400, unlockLevel: 16, center: [2.5, 15.5],   radius: 4.8, color: "#9B8E7E", description: "Rocky highland with old shrines." },
];

export interface Goal { id: string; text: string; done: boolean; reward: number; photo?: boolean; }
export interface ChatMsg { from: "agent" | "you"; text: string; ts: number; }

// ── Decoration scenery (trees/rocks/flowers) — used for placement scoring ──
export interface Scenery { id: string; type: "tree" | "rock" | "flower"; pos: [number, number]; district: DistrictId; variant: number; }

interface GameState {
  screen: ScreenId;
  setScreen: (s: ScreenId) => void;
  selectedAgent: AgentId;
  setSelectedAgent: (id: AgentId) => void;
  coins: number;
  streak: number;
  level: number;
  xp: number;
  agents: Agent[];
  buildings: Building[];
  scenery: Scenery[];
  goals: Goal[];

  // Island era / graduation
  islandEra: number;
  islandHistory: IslandSnapshot[];
  isTransitioning: boolean;
  graduateIsland: () => void;
  canGraduate: boolean;

  // Free-placement build flow
  placingType: BuildingType | null;
  setPlacingType: (t: BuildingType | null) => void;
  placeBuildingAt: (pos: [number, number], rot?: number) => boolean;
  cancelPlacing: () => void;

  completeGoal: (id: string) => void;
  addGoal: (text: string, reward: number, photo?: boolean) => void;
  editGoal: (id: string, text: string, reward: number, photo?: boolean) => void;
  deleteGoal: (id: string) => void;
  pendingCheckIn: Goal | null;
  setPendingCheckIn: (g: Goal | null) => void;
  chats: Record<AgentId, ChatMsg[]>;
  sendChat: (id: AgentId, text: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<GameState | null>(null);
export const GameCtx = Ctx;

const initialAgents: Agent[] = [
  { id: "sofia",  name: "Sofia",  img: a5, skin: "#F4D7B5", shirt: "#7AC5A0", pants: "#3A4A6B", hair: "#3B2820", hairStyle: "long",  mood: 76, line: "Hydrating!",         goal: "2L water", online: true, isYou: true, home: [  0.5,  -1.2] },
  { id: "kael",   name: "Kael",   img: a1, skin: "#E8C29A", shirt: "#6FA8DC", pants: "#2A3550", hair: "#1F1410", hairStyle: "cap",   mood: 84, line: "Let's lift today!", goal: "Gym 45m",  online: true,              home: [ -2.5,  -0.5] },
  { id: "theo",   name: "Theo",   img: a2, skin: "#F4D7B5", shirt: "#C9A0E0", pants: "#5A4030", hair: "#5A3820", hairStyle: "short", mood: 62, line: "Reading slowly...", goal: "Read 15p", online: true,              home: [  2.0,   1.5] },
  { id: "mei",    name: "Mei",    img: a3, skin: "#EFC9A0", shirt: "#E58F7B", pants: "#3A2A40", hair: "#0F0A08", hairStyle: "bun",   mood: 41, line: "Need a walk.",      goal: "Walk 20m", online: false,             home: [ -1.0,   2.0] },
  { id: "jordan", name: "Jordan", img: a4, skin: "#D9A878", shirt: "#F2C46C", pants: "#3A2A1A", hair: "#2A1810", hairStyle: "short", mood: 91, line: "On a roll!",        goal: "Sleep 8h", online: true,              home: [  1.5,  -2.0] },
];

const initialBuildings: Building[] = [];

// Pre-seeded scenery for the main island
const initialScenery: Scenery[] = [
  // main island trees
  { id: "t1", type: "tree", pos: [ 2.7,  1.9], district: "main", variant: 0 },
  { id: "t2", type: "tree", pos: [-2.8, -1.4], district: "main", variant: 1 },
  { id: "t3", type: "tree", pos: [-2.5,  2.2], district: "main", variant: 0 },
  { id: "t4", type: "tree", pos: [ 2.5, -2.4], district: "main", variant: 2 },
  { id: "t5", type: "tree", pos: [ 0.3, -2.8], district: "main", variant: 1 },
  { id: "t6", type: "tree", pos: [-0.3,  2.7], district: "main", variant: 0 },
  // rocks
  { id: "r1", type: "rock", pos: [ 2.9,  0.0], district: "main", variant: 0 },
  { id: "r2", type: "rock", pos: [-2.9,  0.6], district: "main", variant: 1 },
  { id: "r3", type: "rock", pos: [ 0.6,  2.9], district: "main", variant: 0 },
  // flowers
  { id: "f1", type: "flower", pos: [-1.5, -1.8], district: "main", variant: 0 },
  { id: "f2", type: "flower", pos: [ 1.4, -0.5], district: "main", variant: 1 },
  { id: "f3", type: "flower", pos: [-0.2,  1.6], district: "main", variant: 2 },
];

const initialGoals: Goal[] = [
  { id: "g1", text: "Morning meditation",  done: true,  reward: 20 },
  { id: "g2", text: "Drink 2L of water",   done: false, reward: 15, photo: true },
  { id: "g3", text: "Read 15 pages",       done: false, reward: 25 },
  { id: "g4", text: "Sleep before 11pm",   done: false, reward: 30 },
];

const seedChats = (): Record<AgentId, ChatMsg[]> => ({
  sofia:  [{ from: "agent", text: "Hey, that's me! You good?", ts: Date.now() }],
  kael:   [{ from: "agent", text: "Yo! Ready for gym? 💪", ts: Date.now() }],
  theo:   [{ from: "agent", text: "Want me to read aloud later?", ts: Date.now() }],
  mei:    [{ from: "agent", text: "Could really use some company.", ts: Date.now() }],
  jordan: [{ from: "agent", text: "12-day streak baby! 🔥", ts: Date.now() }],
});

const dist = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

// Detect which district a world position belongs to
export const districtAt = (pos: [number, number], districts: District[]): DistrictId | null => {
  for (const d of districts) {
    if (!d.unlocked) continue;
    if (dist(pos, d.center) <= d.radius) return d.id;
  }
  return null;
};

// Compute placement score for a building at pos
export const scorePlacement = (
  type: BuildingType,
  pos: [number, number],
  buildings: Building[],
  scenery: Scenery[],
  islandRadius: number = 7.0,
): { score: number; valid: boolean; reason?: string; breakdown: { label: string; pts: number }[] } => {
  const opt = BUILD_LIBRARY.find((b) => b.type === type);
  if (!opt) return { score: 0, valid: false, reason: "Unknown", breakdown: [] };

  // Must be within island radius
  if (Math.hypot(pos[0], pos[1]) > islandRadius) {
    return { score: 0, valid: false, reason: "Outside island", breakdown: [] };
  }

  // Collision check
  for (const b of buildings) {
    const other = BUILD_LIBRARY.find((x) => x.type === b.type)!;
    if (dist(b.pos, pos) < opt.radius + other.radius) {
      return { score: 0, valid: false, reason: "Too close", breakdown: [] };
    }
  }

  // Score by rules
  const breakdown: { label: string; pts: number }[] = [];
  let score = 0;
  const apply = (rules: NonNullable<BuildOption["rules"]["likes"]>, sign: 1 | -1) => {
    for (const r of rules) {
      let count = 0;
      if (r.type === "tree" || r.type === "rock" || r.type === "flower") {
        count = scenery.filter((s) => s.type === r.type && dist(s.pos, pos) <= r.range).length;
      } else if (r.type === "water") {
        // water = anywhere near island edge
        const samples = 8;
        for (let i = 0; i < samples; i++) {
          const a = (i / samples) * Math.PI * 2;
          const sp: [number, number] = [pos[0] + Math.cos(a) * r.range, pos[1] + Math.sin(a) * r.range];
          if (Math.hypot(sp[0], sp[1]) > islandRadius) { count++; break; }
        }
      } else {
        count = buildings.filter((b) => b.type === r.type && dist(b.pos, pos) <= r.range).length;
      }
      if (count > 0) {
        const pts = r.pts * count;
        score += pts;
        breakdown.push({ label: `${sign > 0 ? "♥" : "✗"} ${r.type} ×${count}`, pts });
      }
    }
  };
  if (opt.rules.likes) apply(opt.rules.likes, 1);
  if (opt.rules.dislikes) apply(opt.rules.dislikes, -1);

  return { score, valid: true, breakdown };
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState<ScreenId>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("sofia");
  const [coins, setCoins] = useState(2486);
  const [streak] = useState(12);
  const [level, setLevel] = useState(14);
  const [xp, setXp] = useState(72);
  const [agents] = useState<Agent[]>(initialAgents);
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [scenery] = useState<Scenery[]>(initialScenery);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [placingType, setPlacingType] = useState<BuildingType | null>(null);
  const [pendingCheckIn, setPendingCheckIn] = useState<Goal | null>(null);
  const [chats, setChats] = useState<Record<AgentId, ChatMsg[]>>(seedChats);
  const [toast, setToast] = useState<string | null>(null);

  // Island era state
  const [islandEra, setIslandEra] = useState(0);
  const [islandHistory, setIslandHistory] = useState<IslandSnapshot[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const graduateIsland = useCallback(() => {
    const next = ISLAND_TIERS[islandEra + 1];
    if (!next) return;
    if (level < next.unlockLevel) { showToast(`Need Lv.${next.unlockLevel}`); return; }
    // Save snapshot
    setIslandHistory(h => [...h, {
      era: islandEra,
      name: ISLAND_TIERS[islandEra].name,
      emoji: ISLAND_TIERS[islandEra].emoji,
      buildings,
      level,
      coinsEarned: coins,
      graduatedAt: new Date().toISOString(),
    }]);
    // Transition animation
    setIsTransitioning(true);
    setTimeout(() => {
      setIslandEra(islandEra + 1);
      setBuildings([]);
      setScreen(null);
      setIsTransitioning(false);
      showToast(`🏝️ Welcome to ${next.name}!`);
    }, 1200);
  }, [islandEra, buildings, level, coins, showToast]);

  const placeBuildingAt = useCallback((pos: [number, number]): boolean => {
    if (!placingType) return false;
    const opt = BUILD_LIBRARY.find((b) => b.type === placingType)!;
    const currentRadius = ISLAND_TIERS[islandEra].radius;
    const result = scorePlacement(placingType, pos, buildings, scenery, currentRadius);
    if (!result.valid) { showToast(result.reason || "Can't place here"); return false; }
    if (coins < opt.cost) { showToast("Not enough coins"); return false; }
    setCoins((c) => c - opt.cost);
    setBuildings((bs) => [...bs, { id: `b${Date.now()}`, type: placingType, pos, district: "main", score: result.score }]);
    setPlacingType(null);
    showToast(`+${result.score} harmony · ${opt.name} built!`);
    return true;
  }, [placingType, buildings, scenery, coins, islandEra, showToast]);

  const cancelPlacing = useCallback(() => setPlacingType(null), []);

  const completeGoal = useCallback((id: string) => {
    setGoals((gs) => gs.map((g) => g.id === id ? { ...g, done: true } : g));
    const g = goals.find((x) => x.id === id);
    if (g && !g.done) {
      setCoins((c) => c + g.reward);
      setXp((x) => Math.min(100, x + 5));
      setLevel((l) => {
        const newXp = Math.min(100, xp + 5);
        return newXp >= 100 ? l + 1 : l;
      });
      showToast(`+${g.reward} coins · ${g.text} ✓`);
    }
    setPendingCheckIn(null);
  }, [goals, xp, showToast]);

  const addGoal = useCallback((text: string, reward: number, photo?: boolean) => {
    setGoals((gs) => [...gs, { id: `g${Date.now()}`, text, done: false, reward, photo: photo ?? false }]);
  }, []);

  const editGoal = useCallback((id: string, text: string, reward: number, photo?: boolean) => {
    setGoals((gs) => gs.map((g) => g.id === id ? { ...g, text, reward, photo: photo ?? g.photo } : g));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((gs) => gs.filter((g) => g.id !== id));
  }, []);

  const sendChat = useCallback((id: AgentId, text: string) => {
    const userMsg: ChatMsg = { from: "you", text, ts: Date.now() };
    setChats((c) => ({ ...c, [id]: [...c[id], userMsg] }));
    setTimeout(() => {
      const replies = ["Love it 💚", "Let's do it together!", "I'll cheer you on 🏝️", "That sounds wonderful.", "Mmm, I needed that."];
      const reply: ChatMsg = { from: "agent", text: replies[Math.floor(Math.random() * replies.length)], ts: Date.now() };
      setChats((c) => ({ ...c, [id]: [...c[id], reply] }));
    }, 900);
  }, []);

  const canGraduate = !!ISLAND_TIERS[islandEra + 1] && level >= ISLAND_TIERS[islandEra + 1].unlockLevel;

  return (
    <Ctx.Provider value={{
      screen, setScreen,
      selectedAgent, setSelectedAgent,
      coins, streak, level, xp,
      agents, buildings, scenery, goals,
      islandEra, islandHistory, isTransitioning, graduateIsland, canGraduate,
      placingType, setPlacingType, placeBuildingAt, cancelPlacing,
      completeGoal, addGoal, editGoal, deleteGoal, pendingCheckIn, setPendingCheckIn,
      chats, sendChat,
      toast, showToast,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useGame = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGame must be inside GameProvider");
  return v;
};
