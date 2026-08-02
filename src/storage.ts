import type { AppState, Session } from "./types";
import { SEED_PROGRAM } from "./program";
import { supabase, SUPABASE_ENABLED, SYNC_ID } from "./supabase";

const KEY = "liftlog.v1";
const TABLE = "app_state";

export const SYNC_MODE: "supabase" | "local" = SUPABASE_ENABLED ? "supabase" : "local";

function freshState(): AppState {
  return { program: structuredClone(SEED_PROGRAM), sessions: [], activeSessionId: null };
}

export function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.program || !Array.isArray(parsed.sessions)) return freshState();
    return parsed;
  } catch { return freshState(); }
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
  const { error } = await supabase.from(TABLE).upsert(
    { id: SYNC_ID, state, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) console.warn("remote save failed", error.message);
}

export async function reconcileOnLoad(): Promise<AppState> {
  const local = loadLocal();
  if (!SUPABASE_ENABLED) return local;
  const remote = await fetchRemote();
  if (!remote) return local;
  const lt = Date.parse(local.updatedAt ?? "") || 0;
  const rt = Date.parse(remote.updatedAt ?? "") || 0;
  if (rt > lt) {
    try { localStorage.setItem(KEY, JSON.stringify(remote)); } catch { /* ignore */ }
    return remote;
  }
  return local;
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
  return parsed;
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
