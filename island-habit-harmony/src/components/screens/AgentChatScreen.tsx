import { ChevronLeft, Send, Mic, Plus } from "lucide-react";
import { StatusBar } from "../StatusBar";
import a1 from "@/assets/agent-1.png";

const messages = [
  { from: "agent", text: "Morning, friend ☀️ I peeked at your sleep — 7h, nice work." },
  { from: "user", text: "Thanks! Feeling alright. Gym later?" },
  { from: "agent", text: "Yes please. My motivation's at 84 today and I'd love to push it past 90." },
  { from: "user", text: "What about Mei? Their card looked low." },
  { from: "agent", text: "Mei's at 41 — a short walk would help. Want me to nudge them?" },
];

export const AgentChatScreen = () => (
  <div className="h-full w-full bg-background flex flex-col">
    <StatusBar />

    {/* Agent header */}
    <div className="px-4 pt-2 pb-3 flex items-center gap-3 border-b border-border/40">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
        <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2.5} />
      </div>
      <div className="relative">
        <img src={a1} alt="Kael" width={44} height={44} loading="lazy" className="h-11 w-11 rounded-full object-cover bg-secondary-soft" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-extrabold text-foreground leading-tight">Kael</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-bold text-muted-foreground">Motivation</span>
          <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-progress-gradient rounded-full" style={{ width: "84%" }} />
          </div>
          <span className="text-[10px] font-extrabold text-primary">84</span>
        </div>
      </div>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
      <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today</p>
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
          {m.from === "agent" && (
            <img src={a1} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 rounded-full object-cover bg-secondary-soft flex-shrink-0" />
          )}
          <div
            className={`max-w-[78%] px-3.5 py-2.5 text-[12px] font-medium leading-snug shadow-soft ${
              m.from === "user"
                ? "bg-progress-gradient text-white rounded-2xl rounded-br-md"
                : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border/40"
            }`}
          >
            {m.text}
          </div>
        </div>
      ))}
      {/* typing */}
      <div className="flex items-end gap-2">
        <img src={a1} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 rounded-full object-cover bg-secondary-soft" />
        <div className="bg-card rounded-2xl rounded-bl-md px-3.5 py-3 border border-border/40 shadow-soft">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" style={{ animationDelay: "0.2s" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>

    {/* Composer */}
    <div className="px-3 pb-5 pt-2 border-t border-border/40 bg-card/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <button className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Plus className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
        </button>
        <div className="flex-1 bg-muted rounded-full px-4 py-2.5 flex items-center">
          <span className="text-[12px] text-muted-foreground flex-1">Message Kael…</span>
          <Mic className="h-4 w-4 text-muted-foreground" strokeWidth={2.2} />
        </div>
        <button className="h-9 w-9 rounded-full bg-progress-gradient flex items-center justify-center flex-shrink-0 shadow-soft">
          <Send className="h-4 w-4 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  </div>
);
