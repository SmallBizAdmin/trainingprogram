import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LoggedExercise,
  LoggedSet,
  Program,
  ProgramExercise,
  Session,
} from "./types";
import { exerciseHistory } from "./storage";
import {
  ChevUp,
  ChevDown,
  Plus,
  Minus,
  X,
  History,
  Swap,
  Trash,
} from "./icons";

const catColor: Record<string, string> = {
  push: "text-ember",
  pull: "text-steel",
  legs: "text-acid",
  core: "text-chalk",
  other: "text-muted",
};

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Auto-resizing textarea so notes grow with content instead of needing scroll
function AutoTextarea({
  value,
  onChange,
  className = "",
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={className}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// HISTORY MODAL
// ---------------------------------------------------------------------------

export function HistoryModal({
  exerciseName,
  sessions,
  currentSessionId,
  onClose,
}: {
  exerciseName: string;
  sessions: Session[];
  currentSessionId: string;
  onClose: () => void;
}) {
  const entries = useMemo(
    () => exerciseHistory(sessions, exerciseName, currentSessionId),
    [sessions, exerciseName, currentSessionId]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line bg-panel rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-panel px-4 py-3">
          <div className="flex items-center gap-2 text-acid">
            <History width={18} height={18} />
            <h3 className="font-display text-lg uppercase tracking-wide text-chalk">
              {exerciseName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-panel2 hover:text-chalk"
          >
            <X />
          </button>
        </div>

        <div className="p-4">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No past sessions logged for this exercise yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {entries.map((e, i) => (
                <li key={i} className="rounded-xl border border-line bg-panel2 p-3">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-display text-sm uppercase tracking-wide text-chalk">
                      {fmtDate(e.date)}
                    </span>
                    {e.topWeight != null && (
                      <span className="tnum font-mono text-sm text-acid">
                        top {e.topWeight}kg
                      </span>
                    )}
                  </div>
                  {e.machineVariation ? (
                    <p className="mb-2 text-xs italic text-steel">{e.machineVariation}</p>
                  ) : (
                    <p className="mb-2 text-xs italic text-muted/60">no machine label</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {e.sets.map((s, j) => (
                      <span key={j} className="tnum rounded-md bg-ink px-2 py-1 font-mono text-xs text-muted">
                        {s.weight ?? "–"}
                        <span className="text-muted/50">kg ×</span>
                        {s.reps ?? "–"}
                      </span>
                    ))}
                  </div>
                  {e.notes.trim() && (
                    <p className="mt-2 border-l-2 border-line pl-2 text-xs leading-snug text-muted">
                      {e.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXERCISE PICKER
// ---------------------------------------------------------------------------

export function ExercisePicker({
  program,
  title,
  onPick,
  onClose,
}: {
  program: Program;
  title: string;
  onPick: (
    e: Pick<ProgramExercise, "name" | "targetReps" | "restSeconds" | "category"> & {
      programExerciseId: string | null;
      targetSets: number;
    }
  ) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line bg-panel rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-panel px-4 py-3">
          <h3 className="font-display text-lg uppercase tracking-wide text-chalk">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-panel2 hover:text-chalk">
            <X />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Custom exercise…"
              className="flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-chalk placeholder:text-muted/60 focus:border-acid focus:outline-none"
            />
            <button
              disabled={!custom.trim()}
              onClick={() =>
                onPick({
                  name: custom.trim(),
                  targetReps: "10",
                  restSeconds: 60,
                  category: "other",
                  programExerciseId: null,
                  targetSets: 3,
                })
              }
              className="rounded-lg bg-acid px-3 py-2 text-sm font-semibold text-ink disabled:opacity-30"
            >
              Add
            </button>
          </div>

          {program.days.map((day) => (
            <div key={day.id} className="mb-4">
              <p className="mb-1.5 font-display text-xs uppercase tracking-widest text-muted">{day.name}</p>
              <ul className="space-y-1">
                {day.exercises.map((ex) => (
                  <li key={ex.id}>
                    <button
                      onClick={() =>
                        onPick({
                          name: ex.name,
                          targetReps: ex.targetReps,
                          restSeconds: ex.restSeconds,
                          category: ex.category,
                          programExerciseId: ex.id,
                          targetSets: ex.targetSets,
                        })
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-line bg-panel2 px-3 py-2 text-left text-sm text-chalk hover:border-acid/50"
                    >
                      <span>{ex.name}</span>
                      <span className={`font-mono text-xs ${catColor[ex.category]}`}>
                        {ex.targetSets}×{ex.targetReps}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXERCISE CARD
// ---------------------------------------------------------------------------

export function ExerciseCard({
  ex,
  index,
  total,
  sessions,
  currentSessionId,
  onChange,
  onMove,
  onSwap,
  onRemove,
}: {
  ex: LoggedExercise;
  index: number;
  total: number;
  sessions: Session[];
  currentSessionId: string;
  onChange: (next: LoggedExercise) => void;
  onMove: (dir: -1 | 1) => void;
  onSwap: () => void;
  onRemove: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showProgramNote, setShowProgramNote] = useState(false);

  // Local input string for set count, so typing "10" doesn't truncate to 1 mid-keystroke.
  // Commits the value on blur or Enter.
  const [setsInput, setSetsInput] = useState(String(ex.sets.length));
  useEffect(() => setSetsInput(String(ex.sets.length)), [ex.sets.length]);

  const commitSetCount = () => {
    const t = Math.max(1, Math.min(20, Math.floor(Number(setsInput)) || 1));
    if (t === ex.sets.length) {
      setSetsInput(String(ex.sets.length));
      return;
    }
    if (t > ex.sets.length) {
      const last = ex.sets[ex.sets.length - 1];
      const additions: LoggedSet[] = Array.from({ length: t - ex.sets.length }, () => ({
        reps: null,
        weight: last?.weight ?? null,
      }));
      onChange({ ...ex, sets: [...ex.sets, ...additions] });
    } else {
      onChange({ ...ex, sets: ex.sets.slice(0, t) });
    }
  };

  const setSet = (i: number, patch: Partial<LoggedSet>) => {
    const sets = ex.sets.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...ex, sets });
  };
  const addSet = () => {
    const last = ex.sets[ex.sets.length - 1];
    onChange({
      ...ex,
      sets: [...ex.sets, { reps: null, weight: last?.weight ?? null }],
    });
  };
  const removeSet = (i: number) =>
    onChange({ ...ex, sets: ex.sets.filter((_, j) => j !== i) });

  const accent = catColor[ex.category] ?? "text-muted";

  return (
    <div className="rounded-2xl border border-line bg-panel/80 backdrop-blur-sm">
      {/* header */}
      <div className="flex items-start gap-2 border-b border-line p-3">
        <div className="flex flex-col gap-0.5 pt-0.5">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded p-0.5 text-muted hover:text-chalk disabled:opacity-20"
          >
            <ChevUp width={16} height={16} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded p-0.5 text-muted hover:text-chalk disabled:opacity-20"
          >
            <ChevDown width={16} height={16} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-xs ${accent}`}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="truncate font-display text-base uppercase leading-tight tracking-wide text-chalk">
              {ex.name}
            </h3>
          </div>
          {/* Editable target line: tap sets-count or reps to change. */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <span className="uppercase tracking-widest text-muted/70">target</span>
            <input
              type="number"
              inputMode="numeric"
              value={setsInput}
              onChange={(e) => setSetsInput(e.target.value)}
              onBlur={commitSetCount}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="tnum w-8 border-b border-line/40 bg-transparent text-center font-mono text-xs text-chalk focus:border-acid focus:outline-none"
            />
            <span>×</span>
            <input
              type="text"
              value={ex.targetReps}
              onChange={(e) => onChange({ ...ex, targetReps: e.target.value })}
              className="w-14 border-b border-line/40 bg-transparent text-center font-mono text-xs text-chalk focus:border-acid focus:outline-none"
            />
            <span className="text-muted/60">·</span>
            <input
              type="number"
              inputMode="numeric"
              value={ex.restSeconds}
              onChange={(e) =>
                onChange({
                  ...ex,
                  restSeconds: Math.max(0, Math.min(600, Number(e.target.value) || 0)),
                })
              }
              className="tnum w-10 border-b border-line/40 bg-transparent text-center font-mono text-xs text-chalk focus:border-acid focus:outline-none"
            />
            <span className="text-muted/70">s rest</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => setShowHistory(true)}
            className="rounded-lg p-1.5 text-muted hover:bg-panel2 hover:text-acid"
            title="History"
          >
            <History width={17} height={17} />
          </button>
          <button
            onClick={onSwap}
            className="rounded-lg p-1.5 text-muted hover:bg-panel2 hover:text-steel"
            title="Swap exercise"
          >
            <Swap width={17} height={17} />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-1.5 text-muted hover:bg-panel2 hover:text-ember"
            title="Remove"
          >
            <Trash width={17} height={17} />
          </button>
        </div>
      </div>

      {/* editable coaching note (programNote): persists to template on Save */}
      {(ex.programNote || showProgramNote) ? (
        <AutoTextarea
          value={ex.programNote}
          onChange={(v) => onChange({ ...ex, programNote: v })}
          placeholder="Coaching note — saved to template on Save changes…"
          className="block w-full resize-none border-b border-line bg-acid/5 px-3 py-2 text-xs leading-snug text-acid/90 placeholder:text-acid/30 focus:bg-acid/10 focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setShowProgramNote(true)}
          className="block w-full border-b border-line bg-acid/[0.02] px-3 py-1.5 text-left text-[10px] uppercase tracking-widest text-acid/40 hover:bg-acid/5 hover:text-acid/70"
        >
          + add coaching note
        </button>
      )}

      <div className="p-3">
        {/* machine variation */}
        <input
          value={ex.machineVariation}
          onChange={(e) => onChange({ ...ex, machineVariation: e.target.value })}
          placeholder="Machine / setup label (e.g. Hammer Strength, cable stack A)…"
          className="mb-3 w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs text-steel placeholder:text-muted/50 focus:border-steel focus:outline-none"
        />

        {/* sets grid */}
        <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 px-1 text-[10px] uppercase tracking-widest text-muted">
          <span>Set</span>
          <span className="text-center">kg</span>
          <span className="text-center">reps</span>
          <span />
        </div>
        <div className="space-y-1.5">
          {ex.sets.map((s, i) => (
            <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2">
              <span className="text-center font-mono text-sm text-muted">{i + 1}</span>
              <input
                type="number"
                inputMode="decimal"
                value={s.weight ?? ""}
                onChange={(e) =>
                  setSet(i, { weight: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="–"
                className="tnum w-full rounded-lg border border-line bg-ink py-2.5 text-center font-mono text-base text-chalk placeholder:text-muted/40 focus:border-acid focus:outline-none"
              />
              <input
                type="number"
                inputMode="numeric"
                value={s.reps ?? ""}
                onChange={(e) =>
                  setSet(i, { reps: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="–"
                className="tnum w-full rounded-lg border border-line bg-ink py-2.5 text-center font-mono text-base text-chalk placeholder:text-muted/40 focus:border-acid focus:outline-none"
              />
              <button
                onClick={() => removeSet(i)}
                disabled={ex.sets.length <= 1}
                className="flex justify-center text-muted hover:text-ember disabled:opacity-20"
              >
                <Minus width={16} height={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addSet}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-line py-2 text-xs uppercase tracking-wide text-muted hover:border-acid/50 hover:text-acid"
        >
          <Plus width={14} height={14} /> Add set
        </button>

        {/* per-session note — never saved to template */}
        <button
          onClick={() => setShowNote((v) => !v)}
          className="mt-3 text-xs uppercase tracking-wide text-muted hover:text-chalk"
        >
          {showNote || ex.notes ? "▾ session note" : "+ session note"}
        </button>
        {(showNote || ex.notes) && (
          <AutoTextarea
            value={ex.notes}
            onChange={(v) => onChange({ ...ex, notes: v })}
            placeholder="How it felt today, tweaks for next time… (not saved to template)"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-ink px-3 py-2 text-sm text-chalk placeholder:text-muted/50 focus:border-acid focus:outline-none"
          />
        )}
      </div>

      {showHistory && (
        <HistoryModal
          exerciseName={ex.name}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
