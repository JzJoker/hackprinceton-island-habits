import { Home, Hammer, BarChart3, Clock, MessageCircle, Coins, Flame, TrendingUp, Camera, Check, Circle, Wifi as WifiIcon } from "lucide-react";
import { StatusBar } from "../StatusBar";
import island from "@/assets/island.png";
import a1 from "@/assets/agent-1.png";
import a2 from "@/assets/agent-2.png";
import a3 from "@/assets/agent-3.png";
import a4 from "@/assets/agent-4.png";
import a5 from "@/assets/agent-5.png";

const members = [
  { name: "Kael", img: a1, online: true },
  { name: "Theo", img: a2, online: true },
  { name: "Mei", img: a3, online: false },
  { name: "Jordan", img: a4, online: true },
  { name: "Sofia", img: a5, online: true },
];

const agents = [
  { name: "Kael", img: a1, mood: 84, line: "Feeling strong — let's hit the gym today!" },
  { name: "Theo", img: a2, mood: 62, line: "A little tired but ready to read." },
  { name: "Mei", img: a3, mood: 41, line: "Could use a walk to wake up." },
  { name: "Jordan", img: a4, mood: 91, line: "On a roll — 12-day streak!" },
];

const goals = [
  { text: "Morning meditation", done: true, photo: false },
  { text: "Drink 2L of water", done: false, photo: true },
  { text: "Read 15 pages of a book", done: false, photo: false },
];

export const MainIslandScreen = () => (
  <div className="relative h-full w-full overflow-hidden bg-sky-gradient">
    <StatusBar />

    {/* Group header */}
    <div className="px-4 pt-2">
      <div className="glass rounded-3xl px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Island</p>
          <p className="text-sm font-extrabold text-foreground leading-tight">Pine Hollow</p>
        </div>
        <div className="flex -space-x-2">
          {members.map((m) => (
            <div key={m.name} className="relative">
              <img
                src={m.img}
                alt={m.name}
                width={32}
                height={32}
                loading="lazy"
                className="h-8 w-8 rounded-full border-2 border-white object-cover bg-secondary-soft"
              />
              {m.online && (
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-primary border border-white" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Shared stats */}
    <div className="px-4 mt-3">
      <div className="glass rounded-3xl p-3 grid grid-cols-3 gap-2">
        <StatTile
          icon={<Coins className="h-4 w-4" strokeWidth={2.2} />}
          label="Coins"
          value="248"
          tone="honey"
        />
        <StatTile
          icon={<TrendingUp className="h-4 w-4" strokeWidth={2.2} />}
          label="Weekly"
          value="65%"
          tone="primary"
          progress={65}
        />
        <StatTile
          icon={<Flame className="h-4 w-4" strokeWidth={2.2} />}
          label="Streak"
          value="12d"
          tone="coral"
        />
      </div>
    </div>

    {/* Island render area */}
    <div className="relative h-[230px] mt-1 flex items-center justify-center">
      <img
        src={island}
        alt="island"
        width={1024}
        height={1024}
        className="h-[260px] w-auto object-contain drop-shadow-2xl"
      />
      {/* Floating name tags */}
      <NameTag className="top-12 left-6" name="Kael" mood={84} />
      <NameTag className="top-20 right-8" name="Jordan" mood={91} />
      <NameTag className="bottom-16 left-10" name="Mei" mood={41} dim />
    </div>

    {/* Agent status cards */}
    <div className="mt-1">
      <div className="px-4 flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agents</p>
        <p className="text-[11px] font-semibold text-primary">See all</p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {agents.map((a) => (
          <div key={a.name} className="glass rounded-2xl p-2.5 min-w-[150px] flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src={a.img} alt={a.name} width={32} height={32} loading="lazy" className="h-8 w-8 rounded-full object-cover bg-muted" />
              <div className="flex-1">
                <p className="text-[12px] font-bold text-foreground leading-tight">{a.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.mood > 70 ? "bg-progress-gradient" : a.mood > 50 ? "bg-honey-gradient" : "bg-coral-gradient"}`}
                      style={{ width: `${a.mood}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground">{a.mood}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug line-clamp-2">"{a.line}"</p>
          </div>
        ))}
      </div>
    </div>

    {/* Personal goals */}
    <div className="px-4 mt-3">
      <div className="bg-card rounded-3xl p-3.5 shadow-soft border border-border/40">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Personal</p>
            <p className="text-sm font-extrabold text-foreground leading-tight">Your Goals Today</p>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">2 left</span>
        </div>
        <div className="space-y-1.5">
          {goals.map((g) => (
            <div key={g.text} className="flex items-center gap-2.5 py-1">
              {g.done ? (
                <div className="h-5 w-5 rounded-full bg-progress-gradient flex items-center justify-center shadow-soft flex-shrink-0">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" strokeWidth={2} />
              )}
              <p className={`text-[12px] font-semibold flex-1 ${g.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {g.text}
              </p>
              {g.photo && <Camera className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom nav */}
    <BottomNav active="Home" />
  </div>
);

const StatTile = ({
  icon, label, value, tone, progress,
}: { icon: React.ReactNode; label: string; value: string; tone: "honey" | "primary" | "coral"; progress?: number }) => {
  const bg = tone === "honey" ? "bg-honey-soft text-honey-foreground" : tone === "primary" ? "bg-primary-soft text-primary-foreground" : "bg-accent-soft text-accent-foreground";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5">
        <div className={`h-6 w-6 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
        <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="text-base font-extrabold text-foreground mt-1 leading-none">{value}</p>
      {progress !== undefined && (
        <div className="h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
          <div className="h-full bg-progress-gradient rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

const NameTag = ({ name, mood, className, dim }: { name: string; mood: number; className?: string; dim?: boolean }) => (
  <div className={`absolute glass rounded-full pl-1 pr-2.5 py-1 flex items-center gap-1.5 ${dim ? "opacity-70" : ""} ${className}`}>
    <span className={`h-2 w-2 rounded-full ${mood > 70 ? "bg-primary" : mood > 50 ? "bg-honey" : "bg-accent"}`} />
    <span className="text-[10px] font-bold text-foreground">{name}</span>
  </div>
);

export const BottomNav = ({ active }: { active: string }) => {
  const items = [
    { id: "Home", icon: Home },
    { id: "Build", icon: Hammer },
    { id: "Week", icon: BarChart3 },
    { id: "History", icon: Clock },
    { id: "Chat", icon: MessageCircle },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-2">
      <div className="glass rounded-full px-2 py-2 flex items-center justify-between">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = it.id === active;
          return (
            <div
              key={it.id}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition ${
                isActive ? "bg-progress-gradient text-white shadow-soft" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} />
              <span className="text-[8px] font-bold">{it.id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
