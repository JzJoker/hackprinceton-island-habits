import { X, Lock, Coins, MapPin, Sparkles } from "lucide-react";
import { useGame } from "../state";
import { useOverlayClose } from "@/hooks/useOverlayClose";

export const ExpandOverlay = () => {
  const { screen, setScreen, districts, level, coins, unlockDistrict } = useGame();
  const { closing, close } = useOverlayClose(() => setScreen(null));

  if (screen !== "expand" && !closing) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-8 pointer-events-auto
        bg-black/40 backdrop-blur-sm
        ${closing ? "animate-out fade-out duration-150" : "animate-in fade-in duration-200"}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={`hud-panel max-w-2xl w-full max-h-[85%] flex flex-col overflow-hidden
        ${closing ? "animate-out zoom-out-95 duration-150" : "animate-in zoom-in-95 duration-300"}`}>

        <header className="flex items-center justify-between p-4 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
              <MapPin className="h-4 w-4 text-secondary-foreground" strokeWidth={2.8} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expand archipelago</p>
              <p className="display-font text-base font-bold">Discover new districts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="resource-pill">
              <Coins className="h-4 w-4 text-honey" /> <span className="text-sm">{coins}</span>
            </div>
            <button onClick={close} className="h-9 w-9 rounded-xl bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="p-4 overflow-y-auto space-y-3">
          {districts.map((d) => {
            const canUnlock = !d.unlocked && level >= d.unlockLevel && coins >= d.unlockCost;
            const needsLevel = !d.unlocked && level < d.unlockLevel;
            const needsCoins = !d.unlocked && level >= d.unlockLevel && coins < d.unlockCost;

            return (
              <div
                key={d.id}
                className={`relative rounded-2xl p-4 flex items-center gap-4 border-2 ${
                  d.unlocked ? "bg-primary-soft border-primary" : "bg-card border-border"
                }`}
              >
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-soft"
                  style={{ background: d.color + "55" }}
                >
                  {d.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="display-font text-base font-bold">{d.name}</p>
                    {d.unlocked && (
                      <span className="text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">{d.description}</p>
                  {!d.unlocked && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        needsLevel ? "bg-destructive/20 text-destructive" : "bg-muted text-foreground"
                      }`}>
                        <Sparkles className="h-2.5 w-2.5" /> Lv.{d.unlockLevel}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        needsCoins ? "bg-destructive/20 text-destructive" : "bg-muted text-foreground"
                      }`}>
                        <Coins className="h-2.5 w-2.5" /> {d.unlockCost}
                      </span>
                    </div>
                  )}
                </div>
                {!d.unlocked && (
                  <button
                    disabled={!canUnlock}
                    onClick={() => canUnlock && unlockDistrict(d.id)}
                    className={`px-4 py-2 rounded-xl font-extrabold text-sm flex-shrink-0 ${
                      canUnlock ? "btn-game" : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {canUnlock ? "Unlock" : <Lock className="h-4 w-4 inline" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-foreground/10 bg-secondary-soft/40 text-center text-xs font-bold text-foreground/80">
          🌉 Each unlocked district connects to the main island via a wooden bridge.
        </div>
      </div>
    </div>
  );
};
