import { useGame } from "../state";

export const ToastLayer = () => {
  const { toast } = useGame();
  if (!toast) return null;
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none animate-in fade-in slide-in-from-top duration-200">
      <div className="hud-panel-dark px-5 py-2.5 text-sm font-extrabold display-font shadow-float">
        {toast}
      </div>
    </div>
  );
};
