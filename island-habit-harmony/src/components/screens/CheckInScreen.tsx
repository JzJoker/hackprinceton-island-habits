import { X, Camera, Check, Sparkles, Coins } from "lucide-react";
import { StatusBar } from "../StatusBar";
import island from "@/assets/island.png";

export const CheckInScreen = () => (
  <div className="relative h-full w-full overflow-hidden bg-sky-gradient">
    <StatusBar />

    {/* Dimmed background */}
    <div className="absolute inset-0 flex items-center justify-center opacity-50 blur-sm">
      <img src={island} alt="" width={1024} height={1024} className="h-[280px] w-auto" />
    </div>
    <div className="absolute inset-0 bg-foreground/20" />

    {/* Bottom sheet */}
    <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[36px] shadow-float pb-6">
      <div className="flex justify-center pt-3 pb-2">
        <div className="h-1.5 w-10 rounded-full bg-muted" />
      </div>

      <div className="px-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Check in</p>
            <p className="text-xl font-extrabold text-foreground leading-tight mt-0.5">Drink 2L of water</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Daily · 5:00 PM reminder</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
          </div>
        </div>

        {/* Reward preview */}
        <div className="rounded-2xl bg-honey-soft p-3 flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-honey-gradient flex items-center justify-center shadow-soft">
            <Coins className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-honey-foreground/70">Group earns</p>
            <p className="text-sm font-extrabold text-honey-foreground">+8 coins for Pine Hollow</p>
          </div>
          <Sparkles className="h-4 w-4 text-honey" strokeWidth={2.5} />
        </div>

        {/* Photo capture */}
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Verification (optional)</p>
        <div className="rounded-2xl border-2 border-dashed border-border bg-secondary-soft/40 h-32 flex flex-col items-center justify-center mb-4">
          <div className="h-11 w-11 rounded-full bg-card flex items-center justify-center shadow-soft mb-1.5">
            <Camera className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </div>
          <p className="text-[12px] font-bold text-foreground">Tap to take photo</p>
          <p className="text-[10px] text-muted-foreground">Or skip — your call</p>
        </div>

        {/* Confirm */}
        <button className="w-full h-14 rounded-2xl bg-progress-gradient text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-float">
          <div className="h-7 w-7 rounded-full bg-white/25 flex items-center justify-center">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
          Mark complete
        </button>
        <button className="w-full mt-2 text-[12px] font-bold text-muted-foreground py-2">
          Skip for today
        </button>
      </div>
    </div>

    {/* Floating burst hint */}
    <div className="absolute top-32 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1.5 flex items-center gap-1.5 animate-pulse">
      <Sparkles className="h-3 w-3 text-honey" strokeWidth={2.5} />
      <span className="text-[10px] font-extrabold text-foreground">Almost there — 2 of 3 today</span>
    </div>
  </div>
);
