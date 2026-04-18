import { Coins, Flame, Sparkles, Sun, Bell, Settings, ChevronDown, Zap } from "lucide-react";
import { useGame } from "@/game/state";

export const TopBar = () => {
  const { coins, streak, level, xp, agents, screen, setScreen } = useGame();
  const onlineCount = agents.filter((a) => a.online).length;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between p-4 pointer-events-none">
      {/* Left side */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* Island name + XP — merged panel */}
        <div className="hud-panel-dark w-[300px] px-3 py-2.5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-progress-gradient flex items-center justify-center shadow-inner flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-secondary/80 leading-none">Your Island</p>
                <p className="display-font text-base font-bold leading-tight">Pine Hollow</p>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg ml-2 flex-shrink-0">
                <Zap className="h-3 w-3 text-honey fill-honey" strokeWidth={2.5} />
                <span className="text-[11px] font-black text-honey">Lv.{level}</span>
                <span className="text-[9px] opacity-50 font-bold">→{level + 1}</span>
              </div>
            </div>
            {/* XP bar */}
            <div className="xp-bar h-2 mt-1">
              <div className="xp-bar-fill" style={{ width: `${xp}%` }} />
            </div>
            <p className="text-[9px] opacity-50 mt-0.5 font-semibold tabular-nums">
              {Math.round(xp * 11.5)} / 1,150 XP
            </p>
          </div>
        </div>

        {/* Party strip — click to open party popup */}
        <button
          onClick={() => setScreen(screen === "party" ? null : "party")}
          className={`hud-panel w-[300px] px-3 py-2 flex items-center gap-3 hover:scale-[1.02] transition text-left ${
            screen === "party" ? "ring-2 ring-primary ring-offset-1 ring-offset-transparent" : ""
          }`}
        >
          {/* Avatars */}
          <div className="flex -space-x-1.5">
            {agents.map((a) => (
              <div key={a.id} className="relative" title={a.name}>
                <img
                  src={a.img}
                  alt={a.name}
                  className="h-8 w-8 rounded-full border-2 border-card object-cover bg-secondary-soft"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-card ${a.online ? "bg-primary" : "bg-muted-foreground/40"}`} />
              </div>
            ))}
          </div>

          {/* Divider + count */}
          <div className="border-l border-foreground/15 pl-3 flex items-center gap-1.5">
            <span className="text-[13px] font-black text-foreground tabular-nums">{onlineCount}</span>
            <span className="text-[11px] text-muted-foreground font-semibold">/ {agents.length} online</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground ml-0.5 transition-transform ${screen === "party" ? "rotate-180" : ""}`} />
          </div>
        </button>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="hud-panel-dark px-3 py-1.5 flex items-center gap-2">
            <Sun className="h-4 w-4 text-honey" strokeWidth={2.5} />
            <div className="text-right leading-none">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Day 87</p>
              <p className="text-[11px] font-extrabold display-font">Spring · Wed</p>
            </div>
          </div>
          <button className="hud-panel-dark h-10 w-10 flex items-center justify-center hover:scale-105 transition relative">
            <Bell className="h-4 w-4" strokeWidth={2.5} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </button>
          <button className="hud-panel-dark h-10 w-10 flex items-center justify-center hover:scale-105 transition">
            <Settings className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="resource-pill">
            <span className="h-7 w-7 rounded-full bg-honey-gradient flex items-center justify-center shadow-inner">
              <Coins className="h-4 w-4 text-honey-foreground" strokeWidth={2.8} />
            </span>
            <span className="text-sm tabular-nums">{coins.toLocaleString()}</span>
          </div>
          <div className="resource-pill">
            <span className="h-7 w-7 rounded-full bg-coral-gradient flex items-center justify-center shadow-inner">
              <Flame className="h-4 w-4 text-white" strokeWidth={2.8} />
            </span>
            <span className="text-sm">{streak}<span className="text-[10px] opacity-70 font-semibold">d</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
