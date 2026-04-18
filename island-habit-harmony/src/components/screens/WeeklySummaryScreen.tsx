import { ChevronLeft, Share2, TrendingUp, Hammer, AlertTriangle } from "lucide-react";
import { StatusBar } from "../StatusBar";
import a1 from "@/assets/agent-1.png";
import a2 from "@/assets/agent-2.png";
import a3 from "@/assets/agent-3.png";
import a4 from "@/assets/agent-4.png";
import a5 from "@/assets/agent-5.png";

const contributions = [
  { name: "Jordan", img: a4, pct: 96, count: 22 },
  { name: "Kael", img: a1, pct: 84, count: 19 },
  { name: "Sofia", img: a5, pct: 71, count: 16 },
  { name: "Theo", img: a2, pct: 58, count: 13 },
  { name: "Mei", img: a3, pct: 38, count: 8 },
];

export const WeeklySummaryScreen = () => (
  <div className="h-full w-full bg-sunset flex flex-col">
    <StatusBar />

    <div className="px-4 pt-2 pb-3 flex items-center justify-between">
      <div className="h-9 w-9 rounded-full glass flex items-center justify-center">
        <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Week 14</p>
        <p className="text-sm font-extrabold text-foreground">Weekly Recap</p>
      </div>
      <div className="h-9 w-9 rounded-full glass flex items-center justify-center">
        <Share2 className="h-4 w-4 text-foreground" strokeWidth={2.5} />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
      {/* AI narrative */}
      <div className="glass rounded-3xl p-4 mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-accent bg-accent-soft px-2 py-0.5 rounded-full">AI Story</span>
          <span className="text-[10px] font-bold text-muted-foreground">Pine Hollow</span>
        </div>
        <p className="text-[12px] leading-relaxed text-foreground">
          "A warm, steady week on the island. <span className="font-extrabold text-primary">Jordan</span> led with a 12-day streak, and <span className="font-extrabold text-honey">Sofia</span> finally finished her water goal every day. <span className="font-extrabold text-accent">Mei</span> stumbled mid-week — the lake dock cracked a little. Together, you raised the new <span className="font-extrabold">Greenhouse</span> on Sunday. 🌿"
        </p>
      </div>

      {/* Group rate */}
      <div className="bg-card rounded-3xl p-4 mb-3 shadow-soft border border-border/40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Group completion</p>
            <p className="text-2xl font-extrabold text-foreground leading-none mt-1">71%</p>
          </div>
          <div className="flex items-center gap-1 bg-primary-soft text-primary-foreground rounded-full px-2.5 py-1">
            <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
            <span className="text-[10px] font-extrabold">+8% vs last week</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-progress-gradient rounded-full" style={{ width: "71%" }} />
        </div>
        <div className="grid grid-cols-7 gap-1 mt-3">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
            const h = [60, 80, 45, 75, 90, 65, 85][i];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-full h-12 rounded-md bg-muted overflow-hidden flex items-end">
                  <div className="w-full bg-progress-gradient rounded-md" style={{ height: `${h}%` }} />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground">{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contributions */}
      <div className="bg-card rounded-3xl p-4 mb-3 shadow-soft border border-border/40">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Contributions</p>
        <div className="space-y-2.5">
          {contributions.map((c) => (
            <div key={c.name} className="flex items-center gap-2.5">
              <img src={c.img} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 rounded-full object-cover bg-secondary-soft" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] font-extrabold text-foreground">{c.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">{c.count} habits · {c.pct}%</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-progress-gradient rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buildings delta */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-primary-soft rounded-2xl p-3">
          <Hammer className="h-4 w-4 text-primary-foreground mb-1.5" strokeWidth={2.5} />
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground/70">Built</p>
          <p className="text-base font-extrabold text-primary-foreground leading-tight">Greenhouse</p>
          <p className="text-[10px] text-primary-foreground/70">+ Garden expansion</p>
        </div>
        <div className="bg-accent-soft rounded-2xl p-3">
          <AlertTriangle className="h-4 w-4 text-accent-foreground mb-1.5" strokeWidth={2.5} />
          <p className="text-[10px] font-bold uppercase tracking-wide text-accent-foreground/70">Damaged</p>
          <p className="text-base font-extrabold text-accent-foreground leading-tight">Lake Dock</p>
          <p className="text-[10px] text-accent-foreground/70">Repair: 30 coins</p>
        </div>
      </div>
    </div>
  </div>
);
