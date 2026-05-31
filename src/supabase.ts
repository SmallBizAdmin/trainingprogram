import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Single shared row for a single-user tracker. Override with VITE_SYNC_ID if
// you want to namespace (e.g. a hard-to-guess string for a little privacy).
export const SYNC_ID =
  (import.meta.env.VITE_SYNC_ID as string | undefined) ?? "me";

export const SUPABASE_ENABLED = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(url!, anonKey!)
  : null;
