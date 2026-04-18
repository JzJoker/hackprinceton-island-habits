import { X, Sparkles, ArrowRight, Lock } from "lucide-react";
import { useGame, ISLAND_TIERS } from "../state";
import { useOverlayClose } from "@/hooks/useOverlayClose";

export const ExpandOverlay = () => {
  const { screen, setScreen, islandEra, level, graduateIsland, canGraduate } = useGame();
  const { closing, close } = useOverlayClose(() => setScreen(null));

  if (screen !== "expand" && !closing) return null;

  const current = ISLAND_TIERS[islandEra];
  const next = ISLAND_TIERS[islandEra + 1];

  return (
    <div className={`absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-8 pointer-events-auto bg-black/40 backdrop-blur-sm ${closing ? "animate-out fade-out duration-150" : "animate-in fade-in duration-200"}`}
         onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className={`hud-panel max-w-lg w-full flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl ${closing ? "animate-out slide-out-to-bottom sm:zoom-out-95 duration-150" : "animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"}`}>

        <header className="flex items-center justify-between p-4 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-progress-gradient flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Island Journey</p>
              <p className="display-font text-base font-bold">Move to a New Island</p>
            </div>
          </div>
          <button onClick={close} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center transition">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* Current → Next */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-2xl p-4 bg-card border border-border text-center">
              <div className="text-3xl mb-1">{current.emoji}</div>
              <p className="display-font text-sm font-bold">{current.name}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Current island</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            {next ? (
              <div className={`flex-1 rounded-2xl p-4 text-center border-2 ${canGraduate ? "bg-primary-soft border-primary" : "bg-card border-dashed border-border"}`}>
                <div className="text-3xl mb-1">{next.emoji}</div>
                <p className="display-font text-sm font-bold">{next.name}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  {canGraduate ? "Ready!" : `Unlocks at Lv.${next.unlockLevel}`}
                </p>
              </div>
            ) : (
              <div className="flex-1 rounded-2xl p-4 bg-card border border-dashed border-border text-center">
                <div className="text-3xl mb-1">🌌</div>
                <p className="display-font text-sm font-bold">Max era</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">You&apos;ve seen it all</p>
              </div>
            )}
          </div>

          {next && (
            <>
              <div className="quest-scroll p-3">
                <p className="text-xs font-semibold text-foreground/70 leading-relaxed">{next.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                    Bigger island (r={next.radius})
                  </span>
                  <span className="text-[10px] font-black bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                    New environment
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground font-semibold">
                ⚠️ Your current buildings stay as a memory. The new island starts fresh.
              </div>

              <button
                onClick={() => { if (canGraduate) { graduateIsland(); close(); } }}
                disabled={!canGraduate}
                className={`w-full py-3 rounded-xl font-extrabold text-sm transition ${canGraduate ? "btn-game-coral" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                {canGraduate ? `✈️ Fly to ${next.name}` : <><Lock className="h-3.5 w-3.5 inline mr-1" />Need Lv.{next.unlockLevel} (you are Lv.{level})</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
