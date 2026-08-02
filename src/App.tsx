import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AppState,
  LoggedExercise,
  ProgramDay,
  ProgramExercise,
  Session,
} from "./types";
import {
  loadLocal,
  reconcileOnLoad,
  save,
  saveLocal,
  uid,
  exportJSON,
  importJSON,
  SYNC_MODE,
} from "./storage";
import { ExerciseCard, ExercisePicker } from "./components";
import { Clock, Plus, Check, X, Dumbbell, ChevDown, Save as SaveIcon } from "./icons";

function sessionFromDay(day: ProgramDay): Session {
  const exercises: LoggedExercise[] = day.exercises.map((ex, i) => ({
    programExerciseId: ex.id,
    name: ex.name,
    category: ex.category,
    order: i,
    machineVariation: "",
    notes: "",
    programNote: ex.notes,
    targetReps: ex.targetReps,
    restSeconds: ex.restSeconds,
    sets: Array.from({ length: ex.targetSets }, () => ({ reps: null, weight: null })),
  }));
  return {
    id: uid("sess"),
    dayId: day.id,
    dayName: day.name,
    date: new Date().toISOString().slice(0, 10),
    startTime: null,
    endTime: null,
    exercises,
  };
}

function durationLabel(start: string | null, end: string | null): string {
  if (!start) return "";
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((b - a) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function timeLabel(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const catDot: Record<string, string> = {
  push: "bg-ember",
  pull: "bg-steel",
  legs: "bg-acid",
};

export default function App() {
  const [state, setState] = useState<AppState>(() => loadLocal());
  const [picker, setPicker] = useState<
    null | { mode: "add" } | { mode: "swap"; exIndex: number }
  >(null);
  const [, forceTick] = useState(0);
  const [syncing, setSyncing] = useState(SYNC_MODE === "supabase");
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = useRef(SYNC_MODE === "local");

  useEffect(() => {
    let alive = true;
    reconcileOnLoad().then((resolved) => {
      if (!alive) return;
      setState(resolved);
      ready.current = true;
      setSyncing(false);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (ready.current) save(state);
    else saveLocal(state);
  }, [state]);

  const active = useMemo(
    () => state.sessions.find((s) => s.id === state.activeSessionId) ?? null,
    [state.sessions, state.activeSessionId]
  );

  useEffect(() => {
    if (active?.startTime && !active.endTime) {
      const t = setInterval(() => forceTick((n) => n + 1), 30000);
      return () => clearInterval(t);
    }
  }, [active?.startTime, active?.endTime]);

  const patchActive = (fn: (s: Session) => Session) =>
    setState((st) => ({
      ...st,
      sessions: st.sessions.map((s) => (s.id === st.activeSessionId ? fn(s) : s)),
    }));

  const startDay = (day: ProgramDay) => {
    const sess = sessionFromDay(day);
    sess.startTime = new Date().toISOString();
    setState((st) => ({ ...st, sessions: [sess, ...st.sessions], activeSessionId: sess.id }));
  };

  const openSession = (id: string) => setState((st) => ({ ...st, activeSessionId: id }));
  const goHome = () => setState((st) => ({ ...st, activeSessionId: null }));
  const finishSession = () => patchActive((s) => ({ ...s, endTime: new Date().toISOString() }));
  const resumeSession = () => patchActive((s) => ({ ...s, endTime: null }));

  const setExercise = (i: number, next: LoggedExercise) =>
    patchActive((s) => ({ ...s, exercises: s.exercises.map((e, j) => (j === i ? next : e)) }));

  const moveExercise = (i: number, dir: -1 | 1) =>
    patchActive((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.exercises.length) return s;
      const arr = [...s.exercises];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, exercises: arr };
    });

  const removeExercise = (i: number) =>
    patchActive((s) => ({ ...s, exercises: s.exercises.filter((_, j) => j !== i) }));

  const deleteSession = (id: string) => {
    if (!confirm("Delete this session permanently?")) return;
    setState((st) => ({
      ...st,
      sessions: st.sessions.filter((s) => s.id !== id),
      activeSessionId: st.activeSessionId === id ? null : st.activeSessionId,
    }));
  };

  // ---- Save current session's exercise list back to the program template -----
  // Captures: order, name, targetSets (= sets.length), targetReps, restSeconds,
  // category, programNote. Does NOT save: logged weights/reps, machineVariation,
  // per-session notes. Also remaps the active session's programExerciseId values
  // so history lookups stay tidy.
  const saveSessionToTemplate = () => {
    if (!active) return;
    const dayName = active.dayName;
    const ok = confirm(
      `Save current exercise list, order, and targets as the new "${dayName}" template?\n\nFuture ${dayName} sessions will start from this state. Logged weights/reps and per-session notes are not affected.`
    );
    if (!ok) return;

    setState((st) => {
      // Build the new template exercises from the active session, preserving
      // ids that already match the day's template (so they stay stable).
      const day = st.program.days.find((d) => d.id === active.dayId);
      if (!day) return st;

      const idRemap = new Map<string | null, string>();
      const newTemplateExs: ProgramExercise[] = active.exercises.map((ex) => {
        const existing = day.exercises.find((e) => e.id === ex.programExerciseId);
        const newId = existing?.id ?? uid("ex");
        idRemap.set(ex.programExerciseId, newId);
        return {
          id: newId,
          name: ex.name,
          targetSets: ex.sets.length,
          targetReps: ex.targetReps,
          restSeconds: ex.restSeconds,
          notes: ex.programNote,
          category: ex.category,
        };
      });

      // Update the active session so its exercises link to the new template ids.
      const updatedSessions = st.sessions.map((s) => {
        if (s.id !== active.id) return s;
        return {
          ...s,
          exercises: s.exercises.map((ex) => ({
            ...ex,
            programExerciseId: idRemap.get(ex.programExerciseId) ?? ex.programExerciseId,
          })),
        };
      });

      return {
        ...st,
        program: {
          ...st.program,
          days: st.program.days.map((d) =>
            d.id === active.dayId ? { ...d, exercises: newTemplateExs } : d
          ),
        },
        sessions: updatedSessions,
      };
    });

    // small UX ack — alert is mobile-native and clear
    setTimeout(() => alert(`"${dayName}" template updated.`), 50);
  };

  // ---- export / import ----
  const doExport = () => {
    const blob = new Blob([exportJSON(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liftlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importJSON(String(reader.result));
        if (confirm("Replace all current data with this backup?")) setState(next);
      } catch (e) {
        alert((e as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="relative z-10 mx-auto min-h-full max-w-lg px-4"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))",
        // Generous bottom padding to keep the fixed Finish bar from hiding the
        // last card's contents or the Add/Save buttons that sit below.
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 9rem)",
      }}
    >
      {active ? (
        <ActiveSessionView
          session={active}
          state={state}
          onHome={goHome}
          onFinish={finishSession}
          onResume={resumeSession}
          onSetExercise={setExercise}
          onMove={moveExercise}
          onRemove={removeExercise}
          onSwap={(i) => setPicker({ mode: "swap", exIndex: i })}
          onAdd={() => setPicker({ mode: "add" })}
          onSaveTemplate={saveSessionToTemplate}
        />
      ) : (
        <HomeView
          state={state}
          syncing={syncing}
          onStart={startDay}
          onOpen={openSession}
          onDelete={deleteSession}
          onExport={doExport}
          onImportClick={() => fileRef.current?.click()}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) doImport(f);
          e.target.value = "";
        }}
      />

      {picker && active && (
        <ExercisePicker
          program={state.program}
          title={picker.mode === "add" ? "Add exercise" : "Swap exercise"}
          onClose={() => setPicker(null)}
          onPick={(p) => {
            // Build the new logged exercise. Use the picked exercise's
            // targetSets so a swap from the library brings its proper set
            // count, not a hardcoded 3.
            const programEx = state.program.days
              .flatMap((d) => d.exercises)
              .find((e) => e.id === p.programExerciseId);

            const startingSets = Math.max(1, p.targetSets || programEx?.targetSets || 3);

            const newEx: LoggedExercise = {
              programExerciseId: p.programExerciseId,
              name: p.name,
              category: p.category,
              order: 0,
              machineVariation: "",
              notes: "",
              programNote: programEx?.notes ?? "",
              targetReps: p.targetReps,
              restSeconds: p.restSeconds,
              sets: Array.from({ length: startingSets }, () => ({
                reps: null,
                weight: null,
              })),
            };

            if (picker.mode === "add") {
              patchActive((s) => ({ ...s, exercises: [...s.exercises, newEx] }));
            } else {
              const i = picker.exIndex;
              patchActive((s) => ({
                ...s,
                exercises: s.exercises.map((e, j) =>
                  j === i
                    ? { ...newEx, sets: e.sets, machineVariation: e.machineVariation }
                    : e
                ),
              }));
            }
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

// ===========================================================================
// HOME
// ===========================================================================

function HomeView({
  state,
  syncing,
  onStart,
  onOpen,
  onDelete,
  onExport,
  onImportClick,
}: {
  state: AppState;
  syncing: boolean;
  onStart: (d: ProgramDay) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImportClick: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const recent = state.sessions;

  return (
    <div className="rise">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="text-acid" width={22} height={22} />
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-chalk">
              Lift<span className="text-acid">log</span>
            </h1>
          </div>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-muted">{state.program.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                SYNC_MODE === "supabase"
                  ? syncing ? "bg-steel live-dot" : "bg-acid"
                  : "bg-muted"
              }`}
            />
            <span className="text-muted">
              {SYNC_MODE === "supabase" ? (syncing ? "syncing…" : "cloud synced") : "local only"}
            </span>
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg border border-line bg-panel px-3 py-2 text-xs uppercase tracking-wide text-muted hover:text-chalk"
          >
            Data
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-line bg-panel text-sm"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button onClick={() => { onExport(); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-chalk hover:bg-panel2">
                Export backup
              </button>
              <button onClick={() => { onImportClick(); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-chalk hover:bg-panel2">
                Import backup
              </button>
            </div>
          )}
        </div>
      </header>

      <p className="mb-2 font-display text-xs uppercase tracking-widest text-muted">Start a session</p>
      <div className="mb-8 grid grid-cols-2 gap-3">
        {state.program.days.map((day) => (
          <button
            key={day.id}
            onClick={() => onStart(day)}
            className="group rounded-2xl border border-line bg-panel p-4 text-left transition hover:border-acid/60"
          >
            <span className="font-display text-xl uppercase tracking-wide text-chalk group-hover:text-acid">
              {day.name}
            </span>
            <p className="mt-1 text-xs leading-snug text-muted">{day.subtitle}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted/70">
              {day.exercises.length} exercises
            </p>
          </button>
        ))}
      </div>

      <p className="mb-2 font-display text-xs uppercase tracking-widest text-muted">Recent sessions</p>
      {recent.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-muted">
          No sessions yet. Pick a day above to start logging.
        </p>
      ) : (
        <ul className="space-y-2">
          {recent.map((s) => {
            const totalSets = s.exercises.reduce(
              (n, e) => n + e.sets.filter((x) => x.reps != null).length, 0
            );
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
                <button onClick={() => onOpen(s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span
                    className={`h-8 w-1 shrink-0 rounded-full ${
                      catDot[
                        s.dayName.toLowerCase().includes("push") ? "push"
                          : s.dayName.toLowerCase().includes("pull") ? "pull"
                          : "legs"
                      ] ?? "bg-muted"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-display text-base uppercase tracking-wide text-chalk">{s.dayName}</p>
                    <p className="text-xs text-muted">
                      {new Date(s.date + "T00:00:00").toLocaleDateString(undefined, {
                        weekday: "short", day: "numeric", month: "short",
                      })}
                      {" · "}{durationLabel(s.startTime, s.endTime) || "—"}
                      {" · "}{totalSets} sets
                      {!s.endTime && s.startTime && (<span className="ml-1 text-acid">live</span>)}
                    </p>
                  </div>
                </button>
                <button onClick={() => onDelete(s.id)} className="shrink-0 rounded-lg p-1.5 text-muted hover:text-ember">
                  <X width={16} height={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ===========================================================================
// ACTIVE SESSION
// ===========================================================================

function ActiveSessionView({
  session,
  state,
  onHome,
  onFinish,
  onResume,
  onSetExercise,
  onMove,
  onRemove,
  onSwap,
  onAdd,
  onSaveTemplate,
}: {
  session: Session;
  state: AppState;
  onHome: () => void;
  onFinish: () => void;
  onResume: () => void;
  onSetExercise: (i: number, e: LoggedExercise) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onRemove: (i: number) => void;
  onSwap: (i: number) => void;
  onAdd: () => void;
  onSaveTemplate: () => void;
}) {
  const running = !!session.startTime && !session.endTime;
  const done = !!session.endTime;

  return (
    // NOTE: no `.rise` here — its transform: translateY animation creates a
    // containing block on the parent which breaks position: sticky on the
    // header card below.
    <div>
      {/* sticky timer header — pinned so the running clock stays visible
          while scrolling through exercises. */}
      <header
        className="sticky -mx-4 z-30 mb-4 px-4 pb-3 backdrop-blur"
        style={{
          top: "env(safe-area-inset-top, 0px)",
          paddingTop: "0.75rem",
          backgroundColor: "rgba(12, 13, 14, 0.92)",
        }}
      >
        <button
          onClick={onHome}
          className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted hover:text-chalk"
        >
          <ChevDown width={12} height={12} className="rotate-90" /> All sessions
        </button>

        <div className="rounded-2xl border border-line bg-panel p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl uppercase tracking-wide text-chalk">
                {session.dayName}
              </h1>
              <p className="text-[11px] text-muted">
                {new Date(session.date + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short", day: "numeric", month: "short",
                })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="tnum flex items-center justify-end gap-1.5 font-mono text-2xl text-chalk">
                {running && (
                  <span className="live-dot inline-block h-2 w-2 rounded-full bg-acid" />
                )}
                {durationLabel(session.startTime, session.endTime) || "0m"}
              </div>
              <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted">
                <Clock width={11} height={11} />
                {timeLabel(session.startTime)} – {timeLabel(session.endTime)}
              </p>
            </div>
          </div>

          {done && (
            <button
              onClick={onResume}
              className="mt-2 w-full rounded-lg border border-line py-1.5 text-[11px] uppercase tracking-wide text-muted hover:text-chalk"
            >
              Reopen session
            </button>
          )}
        </div>
      </header>

      {/* exercises */}
      <div className="space-y-3">
        {session.exercises.map((ex, i) => (
          <ExerciseCard
            key={i}
            ex={ex}
            index={i}
            total={session.exercises.length}
            sessions={state.sessions}
            currentSessionId={session.id}
            onChange={(next) => onSetExercise(i, next)}
            onMove={(dir) => onMove(i, dir)}
            onSwap={() => onSwap(i)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>

      <button
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-3 text-sm uppercase tracking-wide text-muted hover:border-acid/50 hover:text-acid"
      >
        <Plus width={16} height={16} /> Add exercise
      </button>

      {/* Save-to-template — commits the current order, exercises, set count,
          target reps, rest, and coaching notes back to the program template
          so future sessions of this day start from here. */}
      <button
        onClick={onSaveTemplate}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-panel/50 py-3 text-xs uppercase tracking-wide text-muted hover:border-steel/40 hover:bg-panel hover:text-steel"
      >
        <SaveIcon width={14} height={14} />
        Save changes to {session.dayName} template
      </button>

      {/* sticky finish bar */}
      {!done && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto max-w-lg px-4 py-3">
            <button
              onClick={onFinish}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-acid py-3.5 font-display text-lg uppercase tracking-wide text-ink active:scale-[0.99]"
            >
              <Check width={20} height={20} /> Finish session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
