import { X, Clock, Hammer, Heart, Coins, Flame } from "lucide-react";
import { useGame } from "../state";
import { useOverlayClose } from "@/hooks/useOverlayClose";

const events = [
  { t: "Today 09:12",  icon: <Heart className="h-3.5 w-3.5" />,  text: "Sofia completed Morning meditation",    coin: 20,   tone: "primary" },
  { t: "Today 08:30",  icon: <Hammer className="h-3.5 w-3.5" />, text: "Garden bloomed in season 3",            coin: 0,    tone: "honey" },
  { t: "Yesterday",    icon: <Flame className="h-3.5 w-3.5" />,  text: "Jordan extended streak to 12 days",     coin: 30,   tone: "coral" },
  { t: "Yesterday",    icon: <Hammer className="h-3.5 w-3.5" />, text: "Group built Bonfire 🔥",                 coin: -60,  tone: "honey" },
  { t: "2 days ago",   icon: <Heart className="h-3.5 w-3.5" />,  text: "Kael completed Gym 45m",                coin: 25,   tone: "primary" },
  { t: "3 days ago",   icon: <Heart className="h-3.5 w-3.5" />,  text: "Theo missed Read 15p — island sighed",  coin: 0,    tone: "coral" },
  { t: "4 days ago",   icon: <Hammer className="h-3.5 w-3.5" />, text: "Group built Fountain ⛲",                 coin: -160, tone: "honey" },
  { t: "5 days ago",   icon: <Flame className="h-3.5 w-3.5" />,  text: "Pine Hollow reached Lv. 14",            coin: 0,    tone: "primary" },
];

export const HistoryOverlay = () => {
  const { screen, setScreen } = useGame();
  const { closing, close } = useOverlayClose(() => setScreen(null));

  if (screen !== "history" && !closing) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-8 pointer-events-auto
        bg-black/40 backdrop-blur-sm
        ${closing ? "animate-out fade-out duration-150" : "animate-in fade-in duration-200"}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={`hud-panel max-w-xl w-full max-h-[85%] flex flex-col overflow-hidden
        ${closing ? "animate-out zoom-out-95 duration-150" : "animate-in zoom-in-95 duration-300"}`}>

        <header className="flex items-center justify-between p-4 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-lavender flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" strokeWidth={2.8} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Island history</p>
              <p className="display-font text-base font-bold">Timeline · 7 days</p>
            </div>
          </div>
          <button onClick={close} className="h-9 w-9 rounded-xl bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-y-auto p-4">
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
            {events.map((e, i) => {
              const tone = e.tone === "primary" ? "bg-primary" : e.tone === "honey" ? "bg-honey" : "bg-accent";
              return (
                <div key={i} className="relative mb-3">
                  <div className={`absolute -left-5 top-2 h-3 w-3 rounded-full border-2 border-card ${tone}`} />
                  <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-soft">
                    <div className={`h-8 w-8 rounded-lg ${tone} text-white flex items-center justify-center flex-shrink-0`}>
                      {e.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{e.t}</p>
                      <p className="text-sm font-bold text-foreground truncate">{e.text}</p>
                    </div>
                    {e.coin !== 0 && (
                      <span className={`text-xs font-black flex items-center gap-0.5 ${e.coin > 0 ? "text-primary" : "text-destructive"}`}>
                        <Coins className="h-3 w-3" /> {e.coin > 0 ? "+" : ""}{e.coin}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
