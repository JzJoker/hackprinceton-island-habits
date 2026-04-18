import { useState } from "react";
import { Camera, Check, ChevronRight, Pencil, Plus, Scroll, Trash2, X } from "lucide-react";
import { useGame } from "@/game/state";
import type { Goal } from "@/game/state";

export const QuestLog = () => {
  const { goals, setScreen, setPendingCheckIn, addGoal, editGoal, deleteGoal } = useGame();
  const doneCount = goals.filter((g) => g.done).length;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftReward, setDraftReward] = useState(15);
  const [draftPhoto, setDraftPhoto] = useState(false);

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setAdding(false);
    setDraftText(g.text);
    setDraftReward(g.reward);
    setDraftPhoto(!!g.photo);
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setDraftText("");
    setDraftReward(15);
    setDraftPhoto(false);
  };

  const cancel = () => { setEditingId(null); setAdding(false); };

  const save = () => {
    if (!draftText.trim()) return;
    if (editingId) editGoal(editingId, draftText.trim(), draftReward, draftPhoto);
    else addGoal(draftText.trim(), draftReward, draftPhoto);
    cancel();
  };

  const handleDelete = (id: string) => {
    deleteGoal(id);
    if (editingId === id) cancel();
  };

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
          type="number"
          value={draftReward}
          min={1} max={999}
          onChange={(e) => setDraftReward(Math.max(1, Math.min(999, Number(e.target.value))))}
          className="w-12 text-[11px] font-black text-center bg-honey/20 rounded px-1 py-0.5 outline-none"
        />
        <button
          onClick={() => setDraftPhoto((v) => !v)}
          className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition ${draftPhoto ? "bg-accent/30 text-accent-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Camera className="h-2.5 w-2.5" strokeWidth={2.5} />
          proof
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

  return (
    <div className="absolute right-4 top-[112px] bottom-[88px] z-30 w-[260px] flex flex-col gap-2 pointer-events-auto">
      <div className="quest-scroll p-3 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Scroll className="h-4 w-4 text-accent" strokeWidth={2.5} />
            <p className="display-font text-sm font-bold text-foreground">Today's Quests</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-accent-foreground bg-accent/30 px-2 py-0.5 rounded-full">
              {doneCount}/{goals.length}
            </span>
            <button
              onClick={startAdd}
              className="h-5 w-5 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center transition"
              title="Add quest"
            >
              <Plus className="h-3 w-3 text-white" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Goal list */}
        <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
          {goals.map((g) => {
            if (editingId === g.id) {
              return <EditForm key={g.id} />;
            }

            return (
              <div key={g.id} className="relative group">
                <button
                  onClick={() => { if (!g.done) { setPendingCheckIn(g); setScreen("checkin"); } }}
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
                    <p className={`text-[11px] font-bold ${g.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {g.text}
                    </p>
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

                {/* Edit pencil — appears on hover for all goals */}
                <button
                  onClick={() => startEdit(g)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/90 border border-border opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-white shadow-sm"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" strokeWidth={2.5} />
                </button>
              </div>
            );
          })}

          {/* Add new quest inline form */}
          {adding && <EditForm isNew />}
        </div>

        {/* Footer: group week progress */}
        <div className="mt-2 pt-2 border-t border-foreground/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Group week</span>
            <span className="text-[10px] font-black text-foreground">65%</span>
          </div>
          <div className="xp-bar"><div className="xp-bar-fill" style={{ width: '65%' }} /></div>
        </div>
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
