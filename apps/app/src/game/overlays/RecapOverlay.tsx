import { X, Sparkles, TrendingUp, Coins, Trophy } from "lucide-react";
import { useGame } from "../state";
import { useOverlayClose } from "@/hooks/useOverlayClose";

export const RecapOverlay = () => {
  const { screen, setScreen, agents } = useGame();
  const { closing, close } = useOverlayClose(() => setScreen(null));

  if (screen !== "recap" && !closing) return null;

  const total = agents.reduce((s, a) => s + a.mood, 0);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-8 pointer-events-auto
        bg-black/40 backdrop-blur-sm
        ${closing ? "animate-out fade-out duration-150" : "animate-in fade-in duration-200"}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className={`hud-panel max-w-2xl w-full max-h-[90vh] sm:max-h-[85%] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl
        ${closing ? "animate-out slide-out-to-bottom sm:zoom-out-95 duration-150" : "animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"}`}>

        <header className="flex items-center justify-between p-4 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-coral-gradient flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.8} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weekly recap</p>
              <p className="display-font text-base font-bold">Pine Hollow · Week 12</p>
            </div>
          </div>
          <button onClick={close} className="h-9 w-9 rounded-xl bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* AI narrative */}
          <div className="quest-scroll p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent">AI Narrative</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground font-semibold">
              "This week, <b>Pine Hollow</b> bloomed. Jordan's 12-day streak inspired the group, and Kael led 4 gym sessions.
              Mei missed two morning walks — the island misses her. Together you completed <b>65%</b> of goals
              and earned enough coins to unlock the <b>Library</b>. The bonfire still flickers warmly tonight."
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Stat icon={<Trophy className="h-4 w-4" />} label="Completion" value="65%" tone="primary" />
            <Stat icon={<Coins className="h-4 w-4" />} label="Earned" value="+820" tone="honey" />
            <Stat icon={<Sparkles className="h-4 w-4" />} label="Built" value="2 new" tone="coral" />
          </div>

          {/* Contributions */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Contributions</p>
            <div className="space-y-2">
              {agents.map((a) => (
                <div key={a.id} className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-3">
                  <img src={a.img} className="h-9 w-9 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold">{a.name}</span>
                      <span className="text-xs font-black text-foreground">{Math.round((a.mood / total) * 100)}%</span>
                    </div>
                    <div className="xp-bar h-2"><div className="xp-bar-fill" style={{ width: `${a.mood}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "honey" | "coral" }) => {
  const bg = tone === "primary" ? "bg-primary-soft" : tone === "honey" ? "bg-honey-soft" : "bg-accent-soft";
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <div className="flex justify-center mb-1 opacity-70">{icon}</div>
      <p className="text-lg font-black display-font">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
};
