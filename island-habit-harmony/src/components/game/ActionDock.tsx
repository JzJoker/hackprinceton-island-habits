import { Home, Hammer, Sparkles, Camera, TrendingUp } from "lucide-react";
import { useGame, ScreenId } from "@/game/state";
import { useIsMobile } from "@/hooks/use-mobile";

export const ActionDock = () => {
  const { screen, setScreen } = useGame();
  const isMobile = useIsMobile();

  const leftItems: { id: string; icon: typeof Home; route: ScreenId }[] = [
    { id: "Island", icon: Home,   route: null },
    { id: "Build",  icon: Hammer, route: "build" },
  ];
  const rightItems: { id: string; icon: typeof Home; route: ScreenId }[] = [
    { id: "Report",  icon: TrendingUp, route: "recap" as ScreenId },
    { id: "Journey", icon: Sparkles,   route: "expand" as ScreenId },
  ];

  /* ── Mobile layout ──────────────────────────────────── */
  if (isMobile) {
    return (
      <div
        className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="hud-panel mx-2 mb-2 flex items-end justify-around px-1 py-1.5 pointer-events-auto">

          {leftItems.map((it) => {
            const Icon = it.icon;
            const isActive = screen === it.route;
            return (
              <button
                key={it.id}
                onClick={() => setScreen(it.route)}
                className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition active:scale-90 ${
                  isActive ? "bg-progress-gradient text-white shadow-soft" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                <span className="text-[8px] font-black uppercase tracking-wide">{it.id}</span>
              </button>
            );
          })}

          {/* Center CHECK-IN — elevated, fluid width */}
          <div className="flex-shrink-0 -mt-8 px-2">
            <button
              onClick={() => setScreen("checkin")}
              className="relative h-14 w-14 rounded-full btn-game-coral flex flex-col items-center justify-center shadow-float active:scale-90 transition"
            >
              <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping-soft" />
              <Camera className="h-5 w-5 relative" strokeWidth={2.8} />
              <span className="text-[7px] font-black mt-0.5 relative leading-none">CHECK-IN</span>
            </button>
          </div>

          {rightItems.map((it) => {
            const Icon = it.icon;
            const isActive = screen === it.route;
            return (
              <button
                key={it.id}
                onClick={() => setScreen(it.route)}
                className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition active:scale-90 ${
                  isActive ? "bg-progress-gradient text-white shadow-soft" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                <span className="text-[8px] font-black uppercase tracking-wide">{it.id}</span>
              </button>
            );
          })}

        </div>
      </div>
    );
  }

  /* ── Desktop layout ─────────────────────────────────── */
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-center gap-3 p-4 pointer-events-none">
      <div className="hud-panel-dark px-3 py-2 flex items-center gap-2 max-w-[220px] mr-auto pointer-events-auto">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <p className="text-[11px] font-semibold opacity-90 truncate">
          <span className="font-black opacity-100">Jordan</span> finished sleep · just now
        </p>
      </div>

      <div className="hud-panel flex items-end gap-1 px-2 py-2 pointer-events-auto">
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
            </button>
          );
        })}
      </div>

      <div className="w-[200px] ml-auto" />
    </div>
  );
};
