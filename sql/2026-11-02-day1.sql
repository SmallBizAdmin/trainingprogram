-- LiftLog: put the 2026-11-02 Day 1 session into the synced state.
-- Works whether or not the app_state row exists yet, and won't insert the
-- session twice. Run the whole file in Supabase → SQL Editor, then
-- force-quit and reopen LiftLog on the phone.

-- 1. Make sure the row exists. The placeholder program is replaced by the
--    app's seed template on load (version 0 < current).
insert into app_state (id, state, updated_at)
values (
  'me',
  jsonb_build_object(
    'program', '{"version":0,"title":"","days":[]}'::jsonb,
    'sessions', '[]'::jsonb,
    'activeSessionId', null
  ),
  now()
)
on conflict (id) do nothing;

-- 2. Prepend Day 1 (app lists newest first) and bump the sync timestamp.
update app_state
set
  state = jsonb_set(
    jsonb_set(
      state,
      '{sessions}',
      jsonb_build_array($session$
{
  "id": "sess-20261102-day1",
  "dayId": "day-rot-1",
  "dayName": "Day 1",
  "date": "2026-11-02",
  "startTime": "2026-11-02T09:00:00.000Z",
  "endTime": "2026-11-02T09:35:00.000Z",
  "exercises": [
    {
      "programExerciseId": "ex-0",
      "name": "Bench press",
      "category": "push",
      "order": 0,
      "machineVariation": "",
      "notes": "3x8 @ 90kg then straight into a drop set of 15 @ 60kg.",
      "programNote": "Heavy — RAMP FIRST: bar → 40 → 60 → 75 → working.",
      "targetReps": "6-8",
      "restSeconds": 90,
      "sets": [
        { "weight": 90, "reps": 8 },
        { "weight": 90, "reps": 8 },
        { "weight": 90, "reps": 8 },
        { "weight": 60, "reps": 15 }
      ]
    },
    {
      "programExerciseId": "ex-1",
      "name": "Incline DB press",
      "category": "push",
      "order": 1,
      "machineVariation": "bench hole 4",
      "notes": "With pauses.",
      "programNote": "",
      "targetReps": "8-10",
      "restSeconds": 60,
      "sets": [
        { "weight": 17.5, "reps": 10 },
        { "weight": 17.5, "reps": 10 },
        { "weight": 17.5, "reps": 10 }
      ]
    },
    {
      "programExerciseId": "ex-2",
      "name": "French press",
      "category": "push",
      "order": 2,
      "machineVariation": "EZ bar + 10kg",
      "notes": "Plate weight logged (bar not counted). 45s rest.",
      "programNote": "EZ bar. ~20-22.5kg, slow & controlled. Hard on elbows; back off if it talks.",
      "targetReps": "10-12",
      "restSeconds": 45,
      "sets": [
        { "weight": 10, "reps": 12 },
        { "weight": 10, "reps": 12 },
        { "weight": 10, "reps": 12 }
      ]
    },
    {
      "programExerciseId": "ex-3",
      "name": "Walking lunges (DB/KB)",
      "category": "legs",
      "order": 3,
      "machineVariation": "15kg dumbbells",
      "notes": "",
      "programNote": "Dumbbells. Long stride, drive through the front heel.",
      "targetReps": "10/leg",
      "restSeconds": 45,
      "sets": [
        { "weight": 15, "reps": 10 },
        { "weight": 15, "reps": 10 }
      ]
    },
    {
      "programExerciseId": "ex-4",
      "name": "Leg extension",
      "category": "legs",
      "order": 4,
      "machineVariation": "",
      "notes": "30s rest.",
      "programNote": "",
      "targetReps": "12-15",
      "restSeconds": 30,
      "sets": [
        { "weight": 60, "reps": 15 },
        { "weight": 60, "reps": 15 }
      ]
    },
    {
      "programExerciseId": "ex-5",
      "name": "Standing cable crunch",
      "category": "core",
      "order": 5,
      "machineVariation": "",
      "notes": "~45s rest.",
      "programNote": "Optional finisher — only if time allows.",
      "targetReps": "15",
      "restSeconds": 45,
      "optional": true,
      "sets": [
        { "weight": 30.6, "reps": 15 },
        { "weight": 30.6, "reps": 15 }
      ]
    }
  ]
}
$session$::jsonb) || coalesce(state->'sessions', '[]'::jsonb)
    ),
    '{updatedAt}',
    to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
  ),
  updated_at = now()
where id = 'me'
  and not coalesce(state->'sessions', '[]'::jsonb) @> '[{"id":"sess-20261102-day1"}]'::jsonb;

-- 3. Sanity check: expect Day 1 / 2026-11-02 / 6 exercises.
select
  id,
  state->'sessions'->0->>'dayName' as day,
  state->'sessions'->0->>'date'    as date,
  jsonb_array_length(state->'sessions'->0->'exercises') as exercises,
  jsonb_array_length(state->'sessions') as total_sessions,
  state->>'updatedAt' as updated_at
from app_state
where id = 'me';
