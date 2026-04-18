import { useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import { useGame } from "../state";
import { useOverlayClose } from "@/hooks/useOverlayClose";

export const PartyOverlay = () => {
  const { screen, setScreen, agents } = useGame();
  const { closing, close } = useOverlayClose(() => setScreen(null));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (screen !== "party") return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [screen, close]);

  if (screen !== "party" && !closing) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute left-4 z-50 w-[300px] pointer-events-auto
        ${closing
          ? "animate-out fade-out slide-out-to-top-2 duration-150"
          : "animate-in fade-in slide-in-from-top-2 duration-200"
        }`}
      style={{ top: "160px" }}
    >
      <div className="hud-panel overflow-hidden shadow-float">

        {/* Header — no X, it's a dropdown */}
        <div className="px-4 py-2.5 border-b border-foreground/10 bg-gradient-to-r from-primary-soft/50 to-secondary-soft/30">
          <p className="display-font text-sm font-bold">Party · Pine Hollow</p>
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
            {agents.filter((a) => a.online).length}/{agents.length} online · click outside to close
          </p>
        </div>

        {/* Agent list */}
        <div className="py-1.5 max-h-[440px] overflow-y-auto scrollbar-hide">
          {agents.map((a) => {
            const moodColor =
              a.mood < 50
                ? "linear-gradient(90deg,hsl(12 88% 78%),hsl(8 80% 60%))"
                : a.mood < 70
                ? "linear-gradient(90deg,hsl(45 95% 70%),hsl(35 90% 55%))"
                : "linear-gradient(90deg,hsl(145 60% 65%),hsl(145 55% 45%))";

            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition">

                {/* Avatar — strict fixed size, object-top to show face */}
                <div className="relative flex-shrink-0 w-10 h-10">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-card shadow-soft bg-secondary-soft">
                    <img
                      src={a.img}
                      alt={a.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                    a.online ? "bg-primary" : "bg-muted-foreground/40"
                  }`} />
                  {a.mood > 80 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-honey-gradient flex items-center justify-center border border-white">
                      <Zap className="h-2.5 w-2.5 text-white fill-white" strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* Info — strict 3-row grid */}
                <div className="flex-1 min-w-0">

                  {/* Row 1: name · YOU badge · status */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[12px] font-extrabold text-foreground leading-none">{a.name}</span>
                    {a.isYou && (
                      <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black leading-none flex-shrink-0">YOU</span>
                    )}
                    <span className={`ml-auto text-[10px] font-bold flex-shrink-0 leading-none ${
                      a.online ? "text-primary" : "text-muted-foreground/50"
                    }`}>
                      {a.online ? "● online" : "○ offline"}
                    </span>
                  </div>

                  {/* Row 2: mood bar + number — always same height */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${a.mood}%`, background: moodColor }} />
                    </div>
                    <span className="text-[11px] font-black text-foreground tabular-nums w-6 text-right flex-shrink-0">{a.mood}</span>
                  </div>

                  {/* Row 3: goal · quote */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">🎯 {a.goal}</span>
                    <span className="text-muted-foreground/30 flex-shrink-0 mx-0.5">·</span>
                    <span className="text-[10px] italic text-foreground/40 truncate">"{a.line}"</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-foreground/10 bg-secondary-soft/30">
          <span className="text-[10px] font-bold text-muted-foreground">
            {agents.filter((a) => a.online).length}/{agents.length} members online
          </span>
        </div>
      </div>
    </div>
  );
};
