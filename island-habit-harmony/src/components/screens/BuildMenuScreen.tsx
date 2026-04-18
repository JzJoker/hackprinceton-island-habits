import { ChevronLeft, Coins, Lock, Sparkles } from "lucide-react";
import { StatusBar } from "../StatusBar";
import { BottomNav } from "./MainIslandScreen";

const buildings = [
  { name: "Cabin", emoji: "🏚️", cost: 40, size: "1×1", locked: false },
  { name: "Garden", emoji: "🌷", cost: 25, size: "1×1", locked: false },
  { name: "Bakery", emoji: "🥐", cost: 80, size: "1×2", locked: false },
  { name: "Lake Dock", emoji: "⛵", cost: 65, size: "1×2", locked: false },
  { name: "Library", emoji: "📚", cost: 120, size: "2×2", locked: false },
  { name: "Bridge", emoji: "🌉", cost: 90, size: "1×3", locked: false },
  { name: "Windmill", emoji: "🌾", cost: 150, size: "2×2", locked: true, req: "Reach 80% week" },
  { name: "Lighthouse", emoji: "🗼", cost: 200, size: "1×1", locked: true, req: "30-day streak" },
  { name: "Greenhouse", emoji: "🌿", cost: 110, size: "2×2", locked: false },
  { name: "Festival Tent", emoji: "🎪", cost: 175, size: "2×2", locked: true, req: "All 5 active" },
];

export const BuildMenuScreen = () => (
  <div className="h-full w-full bg-sky-gradient flex flex-col">
    <StatusBar />

    <div className="px-4 pt-2 pb-3 flex items-center justify-between">
      <div className="h-9 w-9 rounded-full glass flex items-center justify-center">
        <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pine Hollow</p>
        <p className="text-sm font-extrabold text-foreground">Build Menu</p>
      </div>
      <div className="glass rounded-full px-2.5 py-1.5 flex items-center gap-1">
        <div className="h-5 w-5 rounded-full bg-honey-gradient flex items-center justify-center">
          <Coins className="h-3 w-3 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xs font-extrabold text-foreground">248</span>
      </div>
    </div>

    {/* Milestone monument */}
    <div className="px-4 mb-3">
      <div className="rounded-3xl p-4 bg-coral-gradient shadow-float relative overflow-hidden">
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/30 backdrop-blur rounded-full px-2 py-0.5">
          <Sparkles className="h-3 w-3 text-white" strokeWidth={2.5} />
          <span className="text-[9px] font-extrabold text-white uppercase tracking-wider">Milestone</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-white/40 backdrop-blur flex items-center justify-center text-3xl">
            🗿
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/90">AI Monument</p>
            <p className="text-sm font-extrabold text-white leading-tight">The Stone of Five</p>
            <p className="text-[10px] text-white/90 mt-0.5">Unlocked at 100 shared completions</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden mr-3">
            <div className="h-full bg-white rounded-full" style={{ width: "78%" }} />
          </div>
          <span className="text-[10px] font-extrabold text-white">78/100</span>
        </div>
      </div>
    </div>

    <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Library</p>

    <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide">
      <div className="grid grid-cols-2 gap-2.5">
        {buildings.map((b) => (
          <div key={b.name} className={`bg-card rounded-2xl p-2.5 shadow-soft border border-border/40 relative ${b.locked ? "opacity-90" : ""}`}>
            <div className="aspect-square rounded-xl bg-secondary-soft flex items-center justify-center text-4xl mb-2 relative">
              {b.emoji}
              {b.locked && (
                <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <p className="text-[12px] font-extrabold text-foreground leading-tight">{b.name}</p>
            {b.locked ? (
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{b.req}</p>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-honey" strokeWidth={2.5} />
                  <span className="text-[10px] font-extrabold text-foreground">{b.cost}</span>
                </div>
                <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{b.size}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <BottomNav active="Build" />
  </div>
);
