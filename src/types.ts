// ---- Program template (static, editable) ----

export type ExerciseCategory =
  | "push"
  | "pull"
  | "legs"
  | "core"
  | "other";

export interface ProgramExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string; // "6" or "6-8" or "10/leg"
  restSeconds: number;
  notes: string; // persistent coaching note shown every session
  category: ExerciseCategory;
}

export interface ProgramDay {
  id: string;
  name: string; // "Pull A"
  subtitle: string; // "back + biceps, posterior legs"
  exercises: ProgramExercise[];
}

export interface Program {
  title: string;
  days: ProgramDay[];
}

// ---- Logged session data ----

export interface LoggedSet {
  reps: number | null;
  weight: number | null; // kg
}

export interface LoggedExercise {
  // links back to the template exercise; if swapped/added, may not match
  programExerciseId: string | null;
  name: string; // snapshot — what was actually performed
  category: ExerciseCategory;
  order: number;
  machineVariation: string; // free text: "Hammer Strength", "cable stack by door", etc.
  notes: string; // per-session note (how it felt, tweaks)
  programNote: string; // snapshot of the persistent coaching note
  targetReps: string; // snapshot of target for reference
  restSeconds: number;
  sets: LoggedSet[];
}

export interface Session {
  id: string;
  dayId: string;
  dayName: string;
  date: string; // ISO date (yyyy-mm-dd)
  startTime: string | null; // ISO datetime
  endTime: string | null; // ISO datetime
  exercises: LoggedExercise[];
}

export interface AppState {
  program: Program;
  sessions: Session[];
  activeSessionId: string | null;
  updatedAt?: string; // ISO — set on every persist, used for sync reconciliation
}
