import type { AppState, Session } from "./types";
import { SEED_PROGRAM } from "./program";
import { supabase, SUPABASE_ENABLED, SYNC_ID } from "./supabase";

// ---------------------------------------------------------------------------
// STORAGE LAYER
// ---------------------------------------------------------------------------
// localStorage is always the immediate, offline-safe cache. When Supabase env
// vars are present it also becomes the source of truth: on load we reconcile
// the local cache against the remote row by `updatedAt` (last write wins), and
// every save writes local instantly and pushes to Supabase on a short debounce.
//
// If the env vars are absent, SUPABASE_ENABLED is false and the app runs
// exactly as before — pure local, zero config. Nothing else in the app needs
// to know which mode is active.
// ---------------------------------------------------------------------------

const KEY = "liftlog.v1";
const TABLE = "app_state";

export const SYNC_MODE: "supabase" | "local" = SUPABASE_ENABLED
  ? "supabase"
  : "local";

function freshState(): AppState {
  return {
    program: structuredClone(SEED_PROGRAM),
    sessions: [],
    activeSessionId: null,
  };
}

// ---- local cache (synchronous, always available) --------------------------

export function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.program || !Array.isArray(parsed.sessions)) return freshState();
    return parsed;
  } catch {
    return freshState();
  }
}

export function saveLocal(state: AppState): AppState {
  const stamped: AppState = { ...state, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(stamped));
  } catch (e) {
    console.error("local save failed", e);
  }
  return stamped;
}

// ---- remote (Supabase) -----------------------------------------------------

async function fetchRemote(): Promise<AppState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("state")
    .eq("id", SYNC_ID)
    .maybeSingle();
  if (error) {
    console.warn("remote fetch failed", error.message);
    return null;
  }
  return (data?.state as AppState) ?? null;
}

async function upsertRemote(state: AppState): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { id: SYNC_ID, state, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  if (error) console.warn("remote save failed", error.message);
}

// Decide what to show on startup: newer of {local cache, remote row}.
export async function reconcileOnLoad(): Promise<AppState> {
  const local = loadLocal();
  if (!SUPABASE_ENABLED) return local;

  const remote = await fetchRemote();
  if (!remote) return local; // nothing in the cloud yet — keep local

  const lt = Date.parse(local.updatedAt ?? "") || 0;
  const rt = Date.parse(remote.updatedAt ?? "") || 0;

  if (rt > lt) {
    try {
      localStorage.setItem(KEY, JSON.stringify(remote));
    } catch {
      /* ignore */
    }
    return remote;
  }
  return local;
}

// ---- debounced push (called on every state change after hydration) --------

let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function save(state: AppState): void {
  const stamped = saveLocal(state); // instant + offline-safe
  if (!SUPABASE_ENABLED) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void upsertRemote(stamped), 700);
}

// ---- misc ------------------------------------------------------------------

export function uid(prefix = "s"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function exportJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text: string): AppState {
  const parsed = JSON.parse(text) as AppState;
  if (!parsed.program || !Array.isArray(parsed.sessions)) {
    throw new Error("File doesn't look like a LiftLog backup.");
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// PURE HELPERS over Session history (used by the weight-history view)
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  date: string;
  machineVariation: string;
  topWeight: number | null;
  sets: { reps: number | null; weight: number | null }[];
}

export function exerciseHistory(
  sessions: Session[],
  exerciseName: string,
  excludeSessionId?: string
): HistoryEntry[] {
  const target = exerciseName.trim().toLowerCase();
  const out: HistoryEntry[] = [];
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    for (const ex of s.exercises) {
      if (ex.name.trim().toLowerCase() !== target) continue;
      const weights = ex.sets
        .map((x) => x.weight)
        .filter((w): w is number => typeof w === "number");
      out.push({
        date: s.date,
        machineVariation: ex.machineVariation,
        topWeight: weights.length ? Math.max(...weights) : null,
        sets: ex.sets,
      });
    }
  }
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return out;
}
