import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The client appends /rest/v1 itself, so the env var must be the bare project
// origin. Tolerate a pasted REST endpoint (".../rest/v1/") or trailing slash —
// otherwise every request 404s with "Invalid path specified in request URL"
// while the UI still says "cloud synced".
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const url = rawUrl ? rawUrl.replace(/\/+$/, "").replace(/\/rest\/v1$/, "") : undefined;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Single shared row for a single-user tracker. Override with VITE_SYNC_ID if
// you want to namespace (e.g. a hard-to-guess string for a little privacy).
export const SYNC_ID =
  (import.meta.env.VITE_SYNC_ID as string | undefined) ?? "me";

export const SUPABASE_ENABLED = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(url!, anonKey!)
  : null;
