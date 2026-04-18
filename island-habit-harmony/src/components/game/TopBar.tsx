import { Coins, Flame, Sparkles, Sun, Bell, Settings, Users, ChevronDown } from "lucide-react";
import { useGame } from "@/game/state";

export const TopBar = () => {
  const { coins, streak, level, agents } = useGame();
  const onlineCount = agents.filter((a) => a.online).length;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between p-4 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="hud-panel-dark px-3 py-2 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-progress-gradient flex items-center justify-center shadow-inner">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="pr-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-secondary/80 leading-none">Your Island</p>
            <p className="display-font text-base font-bold leading-tight">Pine Hollow</p>
          </div>
          <div className="border-l border-white/15 pl-3 flex items-center gap-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-bold opacity-80">Lv. {level}</span>
          </div>
        </div>

        <div className="hud-panel px-2.5 py-1.5 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
          <div className="flex -space-x-2">
            {agents.map((m) => (
              <div key={m.id} className="relative" title={m.name}>
                <img
                  src={m.img}
                  alt={m.name}
                  className="h-7 w-7 rounded-full border-2 border-card object-cover bg-secondary-soft"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${m.online ? "bg-primary" : "bg-muted-foreground/60"}`} />
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold text-foreground pl-1">{onlineCount}/{agents.length}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

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
