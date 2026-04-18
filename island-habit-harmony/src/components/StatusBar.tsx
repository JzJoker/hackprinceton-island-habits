import { Signal, Wifi, BatteryFull } from "lucide-react";

export const StatusBar = ({ dark = false }: { dark?: boolean }) => (
  <div
    className={`flex items-center justify-between px-7 pt-4 pb-1 text-[13px] font-bold ${
      dark ? "text-white" : "text-foreground"
    }`}
  >
    <span>9:41</span>
    <div className="flex items-center gap-1.5">
      <Signal className="h-3.5 w-3.5" strokeWidth={2.5} />
      <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
      <BatteryFull className="h-4 w-4" strokeWidth={2.5} />
    </div>
  </div>
);
