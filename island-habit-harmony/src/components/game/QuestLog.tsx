import { useState } from "react";
import { Camera, Check, ChevronRight, Pencil, Plus, Scroll, Trash2, X } from "lucide-react";
import { useGame } from "@/game/state";
import type { Goal } from "@/game/state";
import { useIsMobile } from "@/hooks/use-mobile";

export const QuestLog = () => {
  const { goals, setScreen, setPendingCheckIn, addGoal, editGoal, deleteGoal } = useGame();
  const isMobile = useIsMobile();
  const doneCount = goals.filter((g) => g.done).length;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftReward, setDraftReward] = useState(15);
  const [draftPhoto, setDraftPhoto] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const startEdit = (g: Goal) => { setEditingId(g.id); setAdding(false); setDraftText(g.text); setDraftReward(g.reward); setDraftPhoto(!!g.photo); };
  const startAdd = () => { setAdding(true); setEditingId(null); setDraftText(""); setDraftReward(15); setDraftPhoto(false); };
  const cancel = () => { setEditingId(null); setAdding(false); };
  const save = () => {
    if (!draftText.trim()) return;
    if (editingId) editGoal(editingId, draftText.trim(), draftReward, draftPhoto);
    else addGoal(draftText.trim(), draftReward, draftPhoto);
    cancel();
  };
  const handleDelete = (id: string) => { deleteGoal(id); if (editingId === id) cancel(); };

  const EditForm = ({ isNew }: { isNew?: boolean }) => (
    <div className={`bg-white/80 rounded-xl p-2 space-y-1.5 border ${isNew ? "border-primary/30" : "border-accent/30"}`}>
      <input
        autoFocus
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        className="w-full text-[11px] font-semibold bg-transparent border-b border-foreground/20 pb-0.5 outline-none text-foreground placeholder:text-muted-foreground"
        placeholder={isNew ? "New quest…" : "Quest description…"}
      />
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-bold">🪙</span>
        <input
          type="number" value={draftReward} min={1} max={999}
          onChange={(e) => setDraftReward(Math.max(1, Math.min(999, Number(e.target.value))))}
          className="w-12 text-[11px] font-black text-center bg-honey/20 rounded px-1 py-0.5 outline-none"
        />
        <button
          onClick={() => setDraftPhoto((v) => !v)}
          className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition ${draftPhoto ? "bg-accent/30 text-accent-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Camera className="h-2.5 w-2.5" strokeWidth={2.5} />proof
        </button>
        <div className="ml-auto flex gap-1">
          <button onClick={save} className="h-6 w-6 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </button>
          <button onClick={cancel} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:scale-105 transition">
            <X className="h-3 w-3 text-muted-foreground" strokeWidth={3} />
          </button>
          {!isNew && editingId && (
            <button onClick={() => handleDelete(editingId)} className="h-6 w-6 rounded-full bg-destructive/20 hover:bg-destructive/40 flex items-center justify-center transition">
              <Trash2 className="h-3 w-3 text-destructive" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /* ── Shared quest list content ───────────────────────── */
  const QuestListContent = () => (
    <>
      <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
        {goals.map((g) => {
          if (editingId === g.id) return <EditForm key={g.id} />;
          return (
            <div key={g.id} className="relative group">
              <button
                onClick={() => { if (!g.done) { setPendingCheckIn(g); setScreen("checkin"); if (isMobile) setSheetOpen(false); } }}
                disabled={g.done}
                className={`w-full flex items-center gap-2 p-2 rounded-xl transition text-left ${
                  g.done ? "bg-primary-soft/60 cursor-default" : "bg-white/60 hover:bg-white/90 cursor-pointer hover:translate-x-0.5"
                }`}
              >
                {g.done ? (
                  <div className="h-6 w-6 rounded-full bg-progress-gradient flex items-center justify-center shadow-soft flex-shrink-0 border-2 border-white">
                    <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/50 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0 pr-5">
                  <p className={`text-[11px] font-bold ${g.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{g.text}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] font-black text-honey-foreground bg-honey/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      +{g.reward}🪙
                    </span>
                    {g.photo && (
                      <span className="text-[9px] font-bold text-accent-foreground bg-accent/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Camera className="h-2.5 w-2.5" strokeWidth={2.8} /> proof
                      </span>
                    )}
                  </div>
                </div>
              </button>
              <button
                onClick={() => startEdit(g)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/90 border border-border opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-white shadow-sm"
              >
                <Pencil className="h-3 w-3 text-muted-foreground" strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
        {adding && <EditForm isNew />}
      </div>

      <div className="mt-2 pt-2 border-t border-foreground/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Group week</span>
          <span className="text-[10px] font-black text-foreground">65%</span>
        </div>
        <div className="xp-bar"><div className="xp-bar-fill" style={{ width: '65%' }} /></div>
      </div>
    </>
  );

  /* ── Mobile layout ──────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="pointer-events-none">
        {/* Floating badge above dock */}
        <button
          onClick={() => setSheetOpen(true)}
          className="absolute left-2 bottom-[72px] z-30 pointer-events-auto hud-panel px-2.5 py-1.5 flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
        >
          <Scroll className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
          <span className="text-[11px] font-extrabold">Quests</span>
          <span className="text-[10px] font-black text-accent-foreground bg-accent/30 px-1.5 py-0.5 rounded-full">
            {doneCount}/{goals.length}
          </span>
          {doneCount < goals.length && (
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          )}
        </button>

        {/* Bottom sheet backdrop */}
        {sheetOpen && (
          <div
            className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
            onClick={() => setSheetOpen(false)}
          />
        )}

        {/* Bottom sheet */}
        {sheetOpen && (
          <div
            className="absolute inset-x-0 bottom-0 z-50 pointer-events-auto rounded-t-3xl overflow-hidden flex flex-col bg-card/95 backdrop-blur-md border-t border-foreground/10 shadow-float animate-in slide-in-from-bottom duration-300"
            style={{ maxHeight: "75vh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="h-1 w-10 rounded-full bg-foreground/20" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Scroll className="h-4 w-4 text-accent" strokeWidth={2.5} />
                <p className="display-font text-sm font-bold">Today's Quests</p>
                <span className="text-[10px] font-black text-accent-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                  {doneCount}/{goals.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={startAdd}
                  className="h-7 w-7 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center transition"
                >
                  <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </button>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="h-7 w-7 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Quest content */}
            <div className="flex-1 overflow-hidden px-4 pb-4 flex flex-col gap-2">
              <div className="quest-scroll p-3 flex flex-col flex-1 overflow-hidden">
                <QuestListContent />
              </div>

              {/* Event card */}
              <button
                onClick={() => { setScreen("history"); setSheetOpen(false); }}
                className="hud-panel-dark p-3 flex items-center gap-2 hover:scale-[1.01] transition flex-shrink-0"
              >
                <div className="h-8 w-8 rounded-xl bg-accent/30 flex items-center justify-center text-base flex-shrink-0">🌧️</div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Event · 2h left</p>
                  <p className="text-[10px] font-extrabold leading-tight">Rain blessing — water habits 2× rewards</p>
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Desktop layout ─────────────────────────────────── */
  return (
    <div className="absolute right-4 top-[112px] bottom-[88px] z-30 w-[260px] flex flex-col gap-2 pointer-events-auto">
      <div className="quest-scroll p-3 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Scroll className="h-4 w-4 text-accent" strokeWidth={2.5} />
            <p className="display-font text-sm font-bold text-foreground">Today's Quests</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-accent-foreground bg-accent/30 px-2 py-0.5 rounded-full">
              {doneCount}/{goals.length}
            </span>
            <button onClick={startAdd} className="h-5 w-5 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center transition">
              <Plus className="h-3 w-3 text-white" strokeWidth={3} />
            </button>
          </div>
        </div>
        <QuestListContent />
      </div>

      <button
        onClick={() => setScreen("history")}
        className="hud-panel-dark p-3 flex items-center gap-2 hover:scale-[1.02] transition"
      >
        <div className="h-9 w-9 rounded-xl bg-accent/30 flex items-center justify-center text-lg flex-shrink-0">🌧️</div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Event · 2h left</p>
          <p className="text-[11px] font-extrabold leading-tight">Rain blessing — water habits 2× rewards</p>
        </div>
        <ChevronRight className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
};
