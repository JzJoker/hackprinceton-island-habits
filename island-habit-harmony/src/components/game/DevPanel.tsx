import { useGame } from "@/game/state";
import { useIsMobile } from "@/hooks/use-mobile";

export const DevPanel = () => {
  const { devNextDay, devLevelUp, level, streak } = useGame();
  const isMobile = useIsMobile();
  if (isMobile) return null;

  return (
    <div className="pointer-events-auto flex flex-row gap-1 p-3 pb-4">
      <button
        onClick={devNextDay}
        className="hud-panel-dark px-3 py-2 flex items-center gap-2 hover:scale-105 active:scale-95 transition text-left"
      >
        <span className="text-base leading-none">☀️</span>
        <div className="leading-none">
          <p className="text-[11px] font-black">Next Day</p>
          <p className="text-[9px] opacity-50 font-semibold mt-0.5">streak {streak}d</p>
        </div>
      </button>
      <button
        onClick={devLevelUp}
        className="hud-panel-dark px-3 py-2 flex items-center gap-2 hover:scale-105 active:scale-95 transition text-left"
      >
        <span className="text-base leading-none">⚡</span>
        <div className="leading-none">
          <p className="text-[11px] font-black">Level Up</p>
          <p className="text-[9px] opacity-50 font-semibold mt-0.5">Lv.{level} → {level + 1}</p>
        </div>
      </button>
    </div>
  );
};
