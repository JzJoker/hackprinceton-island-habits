import { Home, Hammer, BarChart3, MapPin, Camera } from "lucide-react";
import { useGame, ScreenId } from "@/game/state";

export const ActionDock = () => {
  const { screen, setScreen, level, xp } = useGame();

  // 2 left + CHECK-IN center + 2 right = balanced 5-slot dock
  const leftItems:  { id: string; icon: typeof Home; route: ScreenId }[] = [
    { id: "Island", icon: Home,    route: null },
    { id: "Build",  icon: Hammer,  route: "build" },
  ];
  const rightItems: { id: string; icon: typeof Home; route: ScreenId; badge?: string }[] = [
    { id: "Recap",   icon: BarChart3, route: "recap" },
    { id: "Expand",  icon: MapPin,    route: "expand" },
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
        {/* Left: Island + Build */}
        {leftItems.map((it) => {
          const Icon = it.icon;
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
            </button>
          );
        })}

        {/* Center: CHECK-IN elevated */}
        <div className="-mt-8 mx-1">
          <button
            onClick={() => setScreen("checkin")}
            className="relative h-16 w-16 rounded-full btn-game-coral flex flex-col items-center justify-center shadow-float"
          >
            <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping-soft" />
            <Camera className="h-5 w-5 relative" strokeWidth={2.8} />
            <span className="text-[8px] font-black mt-0.5 relative">CHECK-IN</span>
          </button>
        </div>

        {/* Right: Recap + Expand */}
        {rightItems.map((it) => {
          const Icon = it.icon;
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

      <div className="w-[200px] ml-auto" />
    </div>
  );
};
