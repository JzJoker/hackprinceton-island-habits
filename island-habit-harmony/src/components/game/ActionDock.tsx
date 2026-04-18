import { Home, Hammer, BarChart3, MapPin, MessageCircle, Camera } from "lucide-react";
import { useGame, ScreenId } from "@/game/state";

export const ActionDock = () => {
  const { screen, setScreen, level, xp } = useGame();

  const navItems: { id: string; icon: typeof Home; route: ScreenId; badge?: string }[] = [
    { id: "Island",  icon: Home,           route: null },
    { id: "Build",   icon: Hammer,         route: "build" },
    { id: "Recap",   icon: BarChart3,      route: "recap",   badge: "NEW" },
    { id: "Expand",  icon: MapPin,         route: "expand" },
    { id: "Chat",    icon: MessageCircle,  route: "chat",    badge: "2" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-center gap-3 p-4 pointer-events-none">
      <div className="hud-panel-dark px-3 py-2 flex items-center gap-2 max-w-[220px] mr-auto pointer-events-auto">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <p className="text-[11px] font-semibold opacity-90 truncate">
          <span className="font-black opacity-100">Jordan</span> finished sleep · just now
        </p>
      </div>

      <div className="hud-panel flex items-end gap-1 px-2 py-2 pointer-events-auto">
        {navItems.map((it, i) => {
          const Icon = it.icon;
          if (i === 2) {
            return (
              <div key="check-in" className="-mt-8 mx-1 pointer-events-auto">
                <button
                  onClick={() => setScreen("checkin")}
                  className="relative h-16 w-16 rounded-full btn-game-coral flex flex-col items-center justify-center shadow-float"
                >
                  <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping-soft" />
                  <Camera className="h-5 w-5 relative" strokeWidth={2.8} />
                  <span className="text-[8px] font-black mt-0.5 relative">CHECK-IN</span>
                </button>
              </div>
            );
          }
          const isActive = screen === it.route;
          return (
            <button
              key={it.id}
              onClick={() => setScreen(it.route)}
              className={`relative flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-xl transition ${
                isActive ? "bg-progress-gradient text-white shadow-soft" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-wider">{it.id}</span>
              {it.badge && (
                <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-accent text-white text-[8px] font-black flex items-center justify-center border border-white">
                  {it.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hud-panel-dark px-3 py-2 ml-auto pointer-events-auto min-w-[200px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Island XP</span>
          <span className="text-[10px] font-black">Lv {level} → {level + 1}</span>
        </div>
        <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${xp}%` }} /></div>
        <p className="text-[9px] opacity-70 mt-1 font-semibold">{Math.round(xp * 11.5)} / 1,150 XP — next: lighthouse slot</p>
      </div>
    </div>
  );
};
