import { Camera, Hammer, Heart } from "lucide-react";
import island from "@/assets/island.png";
import a1 from "@/assets/agent-1.png";
import a4 from "@/assets/agent-4.png";
import a3 from "@/assets/agent-3.png";

export const IslandStage = () => (
  <div className="absolute inset-0 bg-world overflow-hidden">
    {/* Sky decorations */}
    <div className="absolute top-[12%] left-[18%] h-16 w-28 rounded-full bg-white/60 blur-2xl animate-float-y-lg" />
    <div className="absolute top-[18%] right-[22%] h-12 w-24 rounded-full bg-white/50 blur-2xl animate-float-y" />
    <div className="absolute top-[8%] left-[55%] h-10 w-20 rounded-full bg-white/40 blur-xl animate-float-y-lg" />

    {/* Sun */}
    <div className="absolute top-[14%] right-[10%] h-20 w-20 rounded-full bg-honey/40 blur-2xl" />
    <div className="absolute top-[16%] right-[12%] h-12 w-12 rounded-full bg-gradient-to-br from-honey to-accent shadow-[0_0_60px_hsl(45_95%_65%/0.8)]" />

    {/* Water reflection */}
    <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-secondary/40 to-transparent" />

    {/* Island anchored center */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative animate-float-y-lg">
        <img
          src={island}
          alt="island"
          className="h-[78vh] max-h-[640px] w-auto object-contain drop-shadow-[0_40px_60px_rgba(20,40,80,0.45)]"
        />

        {/* Build slot tap target with pulse */}
        <button className="absolute top-[42%] left-[28%] group" aria-label="Build slot">
          <span className="absolute inset-0 rounded-full bg-primary/40 animate-pulse-ring" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-progress-gradient border-2 border-white shadow-float group-hover:scale-110 transition">
            <Hammer className="h-4 w-4 text-white" strokeWidth={3} />
          </span>
        </button>

        {/* Heart-XP popup near a building */}
        <div className="absolute top-[30%] right-[28%] animate-coin-pop">
          <div className="flex items-center gap-1 text-honey font-extrabold text-sm text-stroke-dark">
            <Heart className="h-4 w-4 fill-accent text-accent" />
            +12
          </div>
        </div>

        {/* Agent Kael — top of island, speech bubble */}
        <div className="absolute top-[20%] left-[42%] flex flex-col items-center animate-bob">
          <div className="speech mb-2 text-[11px] whitespace-nowrap">
            Let's hit the gym! 💪
          </div>
          <div className="relative">
            <img src={a1} alt="Kael" className="h-12 w-12 rounded-full border-[3px] border-white shadow-float bg-card object-cover" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-extrabold shadow-soft border border-white">Kael · 84</span>
          </div>
        </div>

        {/* Agent Jordan */}
        <div className="absolute top-[48%] right-[18%] flex flex-col items-center animate-bob" style={{ animationDelay: '0.6s' }}>
          <div className="speech mb-2 text-[11px] whitespace-nowrap">12-day streak! 🔥</div>
          <div className="relative">
            <img src={a4} alt="Jordan" className="h-12 w-12 rounded-full border-[3px] border-white shadow-float bg-card object-cover" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-extrabold shadow-soft border border-white">Jordan · 91</span>
          </div>
        </div>

        {/* Agent Mei — low motivation */}
        <div className="absolute bottom-[24%] left-[34%] flex flex-col items-center animate-wobble">
          <div className="relative opacity-90">
            <img src={a3} alt="Mei" className="h-11 w-11 rounded-full border-[3px] border-white shadow-float bg-card object-cover grayscale-[40%]" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-white text-[8px] font-black flex items-center justify-center text-white">!</span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-accent text-white text-[9px] font-extrabold shadow-soft border border-white">Mei · 41</span>
          </div>
        </div>

        {/* Floating photo evidence pin */}
        <div className="absolute top-[55%] left-[60%] hud-panel px-2 py-1 flex items-center gap-1 animate-float-y">
          <Camera className="h-3 w-3 text-accent" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-foreground">Sofia · 2m ago</span>
        </div>
      </div>
    </div>

    {/* Vignette */}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(215_50%_15%/0.35)_100%)]" />
  </div>
);
