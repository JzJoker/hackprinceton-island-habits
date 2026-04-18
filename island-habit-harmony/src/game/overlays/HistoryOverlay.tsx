import { X, Clock, Building2 } from "lucide-react";
import { useGame, ISLAND_TIERS } from "../state";
import { useOverlayClose } from "@/hooks/useOverlayClose";

export const HistoryOverlay = () => {
  const { screen, setScreen, islandHistory, islandEra } = useGame();
  const { closing, close } = useOverlayClose(() => setScreen(null));

  if (screen !== "history" && !closing) return null;

  const current = ISLAND_TIERS[islandEra];

  return (
    <div className={`absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-8 pointer-events-auto bg-black/40 backdrop-blur-sm ${closing ? "animate-out fade-out duration-150" : "animate-in fade-in duration-200"}`}
         onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className={`hud-panel max-w-xl w-full max-h-[90vh] sm:max-h-[85%] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl ${closing ? "animate-out slide-out-to-bottom sm:zoom-out-95 duration-150" : "animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"}`}>

        <header className="flex items-center justify-between p-4 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-lavender flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Island Journey</p>
              <p className="display-font text-base font-bold">Past Islands</p>
            </div>
          </div>
          <button onClick={close} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-y-auto p-4 space-y-3">
          {/* Current island */}
          <div className="rounded-2xl p-4 bg-primary-soft border-2 border-primary flex items-center gap-4">
            <div className="text-4xl">{current.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="display-font text-base font-bold">{current.name}</p>
                <span className="text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full uppercase">Current</span>
              </div>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">{current.description}</p>
            </div>
          </div>

          {/* Past islands */}
          {islandHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">🌊</p>
              <p className="text-sm font-bold">No past islands yet</p>
              <p className="text-xs mt-1">Graduate to a new island to see your history here.</p>
            </div>
          )}
          {[...islandHistory].reverse().map((snap, i) => (
            <div key={i} className="rounded-2xl p-4 bg-card border border-border flex items-center gap-4">
              <div className="text-4xl opacity-70">{snap.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="display-font text-sm font-bold text-muted-foreground">{snap.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-foreground/60 flex items-center gap-0.5">
                    <Building2 className="h-3 w-3" /> {snap.buildings.length} buildings
                  </span>
                  <span className="text-[10px] font-bold text-foreground/60">· Lv.{snap.level} when left</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(snap.graduatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
