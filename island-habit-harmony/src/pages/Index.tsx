import { GameWindow } from "@/components/game/GameWindow";
import { GameProvider } from "@/game/state";

const Index = () => {
  return (
    <GameProvider>
      <main className="min-h-screen bg-gradient-to-br from-[hsl(215_45%_14%)] via-[hsl(215_40%_18%)] to-[hsl(220_35%_22%)] p-4 md:p-8 flex flex-col items-center justify-center">
        <header className="w-full max-w-[1600px] mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-progress-gradient flex items-center justify-center shadow-float">
              <span className="text-white font-black text-lg">🏝️</span>
            </div>
            <div>
              <h1 className="display-font text-xl md:text-2xl font-bold text-white tracking-tight">
                Island of Habits
              </h1>
              <p className="text-[11px] text-white/60 font-semibold">Web client · co-op habit world</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hud-panel-dark px-3 py-1.5 text-[11px] font-bold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              5 friends online
            </div>
            <button className="btn-game text-xs">Invite friends</button>
          </div>
        </header>

        <div className="w-full max-w-[1600px]">
          <GameWindow />
        </div>

        <p className="text-white/40 text-[11px] mt-4 font-semibold">
          Drag to rotate · scroll to zoom · click an agent to chat · click a 🔨 slot to build
        </p>
      </main>
    </GameProvider>
  );
};

export default Index;
