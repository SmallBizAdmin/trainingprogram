import type { AppState, Session } from "./types";
import { SEED_PROGRAM, PROGRAM_VERSION } from "./program";
import { supabase, SUPABASE_ENABLED, SYNC_ID } from "./supabase";

const KEY = "liftlog.v1";
const TABLE = "app_state";

export const SYNC_MODE: "supabase" | "local" = SUPABASE_ENABLED ? "supabase" : "local";

function freshState(): AppState {
  return { program: structuredClone(SEED_PROGRAM), sessions: [], activeSessionId: null };
}

// If the saved program predates the current seed, swap in the new template.
// Sessions are untouched — exercise history is matched by name, so anything
// with the same name carries its weights forward.
export function migrateProgram(state: AppState): AppState {
  const v = state.program?.version ?? 1;
  if (v >= PROGRAM_VERSION) return state;
  return { ...state, program: structuredClone(SEED_PROGRAM) };
}

// Raw local read — no migration, so reconcile can compare timestamps fairly.
function loadLocalRaw(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.program || !Array.isArray(parsed.sessions)) return freshState();
    return parsed;
  } catch { return freshState(); }
}

export function loadLocal(): AppState {
  return migrateProgram(loadLocalRaw());
}

export function saveLocal(state: AppState): AppState {
  const stamped: AppState = { ...state, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(stamped)); } catch (e) { console.error("local save failed", e); }
  return stamped;
}

async function fetchRemote(): Promise<AppState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("state").eq("id", SYNC_ID).maybeSingle();
  if (error) { console.warn("remote fetch failed", error.message); return null; }
  return (data?.state as AppState) ?? null;
}

async function upsertRemote(state: AppState): Promise<void> {
  if (!supabase) return;
  // Same rule on the way up: a copy with no sessions never overwrites a
  // remote that has some. Covers the fresh-browser case where the initial
  // fetch failed (bad wifi) and the app fell back to its empty local state.
  if (!hasSessions(state)) {
    const remote = await fetchRemote();
    if (hasSessions(remote)) {
      console.warn("remote save skipped: local has no sessions but remote does");
      return;
    }
  }
  const { error } = await supabase.from(TABLE).upsert(
    { id: SYNC_ID, state, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) console.warn("remote save failed", error.message);
}

const hasSessions = (s: AppState | null | undefined): boolean =>
  !!s && Array.isArray(s.sessions) && s.sessions.length > 0;

export async function reconcileOnLoad(): Promise<AppState> {
  const local = loadLocalRaw();
  if (!SUPABASE_ENABLED) return migrateProgram(local);
  const remote = await fetchRemote();
  if (!remote) return migrateProgram(local);
  const lt = Date.parse(local.updatedAt ?? "") || 0;
  const rt = Date.parse(remote.updatedAt ?? "") || 0;
  // Newer copy wins on its original timestamp — EXCEPT that an empty copy
  // never beats one with logged sessions, whatever the clocks say. A fresh
  // browser (Safari tab, new phone, dev machine) must not wipe the history.
  let useRemote = rt > lt;
  if (hasSessions(local) && !hasSessions(remote)) useRemote = false;
  else if (!hasSessions(local) && hasSessions(remote)) useRemote = true;
  // Migrate AFTER choosing, so a template upgrade on this device never
  // out-ranks sessions logged elsewhere.
  const winner = migrateProgram(useRemote ? remote : local);
  if (useRemote) {
    try { localStorage.setItem(KEY, JSON.stringify(winner)); } catch { /* ignore */ }
  }
  return winner;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function save(state: AppState): void {
  const stamped = saveLocal(state);
  if (!SUPABASE_ENABLED) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void upsertRemote(stamped), 700);
}

export function uid(prefix = "s"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function exportJSON(state: AppState): string { return JSON.stringify(state, null, 2); }
export function importJSON(text: string): AppState {
  const parsed = JSON.parse(text) as AppState;
  if (!parsed.program || !Array.isArray(parsed.sessions)) throw new Error("File doesn't look like a LiftLog backup.");
  return migrateProgram(parsed);
}

export interface HistoryEntry {
  date: string;
  machineVariation: string;
  topWeight: number | null;
  notes: string;
  sets: { reps: number | null; weight: number | null }[];
}

export function exerciseHistory(sessions: Session[], exerciseName: string, excludeSessionId?: string): HistoryEntry[] {
  const target = exerciseName.trim().toLowerCase();
  const out: HistoryEntry[] = [];
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    for (const ex of s.exercises) {
      if (ex.name.trim().toLowerCase() !== target) continue;
      const weights = ex.sets.map((x) => x.weight).filter((w): w is number => typeof w === "number");
      out.push({ date: s.date, machineVariation: ex.machineVariation, topWeight: weights.length ? Math.max(...weights) : null, notes: ex.notes, sets: ex.sets });
    }
  }
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return out;
}
