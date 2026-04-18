import { Suspense } from "react";
import { TopBar } from "./TopBar";
import { QuestLog } from "./QuestLog";
import { ActionDock } from "./ActionDock";
import { Island3D } from "@/game/three/Island3D";
import { BuildOverlay } from "@/game/overlays/BuildOverlay";
import { RecapOverlay } from "@/game/overlays/RecapOverlay";
import { HistoryOverlay } from "@/game/overlays/HistoryOverlay";
import { CheckInOverlay } from "@/game/overlays/CheckInOverlay";
import { ExpandOverlay } from "@/game/overlays/ExpandOverlay";
import { PartyOverlay } from "@/game/overlays/PartyOverlay";
import { ToastLayer } from "@/game/overlays/ToastLayer";

export const GameWindow = () => (
  <div className="game-window w-full h-full relative overflow-hidden">
    {/* Content area — full screen */}
    <div className="absolute inset-0 overflow-hidden">
      {/* Layer 0 — 3D world canvas (lowest) */}
      <div className="absolute inset-0 z-0">
        <Suspense
          fallback={
            <div className="h-full w-full bg-world flex items-center justify-center text-foreground font-bold">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-progress-gradient animate-pulse flex items-center justify-center">
                  <span className="text-white text-2xl">🏝️</span>
                </div>
                <span className="display-font text-lg">Loading island...</span>
              </div>
            </div>
          }
        >
          <Island3D />
        </Suspense>
      </div>

      {/* Layer 1 — HUD panels (above canvas, below overlays) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <TopBar />
        <QuestLog />
        <ActionDock />
      </div>

      {/* Layer 2 — Modal overlays (highest, above EVERYTHING) */}
      <div className="absolute inset-0 z-[100] pointer-events-none" style={{ isolation: "isolate" }}>
        <PartyOverlay />
        <BuildOverlay />
        <RecapOverlay />
        <HistoryOverlay />
        <CheckInOverlay />
        <ExpandOverlay />
      </div>

      {/* Layer 3 — Toast notifications (topmost) */}
      <div className="absolute inset-0 z-[200] pointer-events-none">
        <ToastLayer />
      </div>
    </div>
  </div>
);
