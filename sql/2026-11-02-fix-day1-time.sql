-- Move the hand-inserted Day 1 session back before the Day 2 session that
-- was logged in the app (started 2026-11-01T22:47Z). The original insert
-- guessed 2026-11-02T09:00Z, which sorted it as newer than Day 2.
-- Optional: the app no longer orders "up next" by timestamp, but this keeps
-- the history list and exercise history in the right order.

update app_state
set
  state = jsonb_set(
    state,
    '{sessions}',
    (
      select jsonb_agg(
        case
          when s->>'id' = 'sess-20261102-day1' then
            s || '{"date":"2026-11-01","startTime":"2026-11-01T09:00:00.000Z","endTime":"2026-11-01T09:35:00.000Z"}'::jsonb
          else s
        end
      )
      from jsonb_array_elements(state->'sessions') as s
    )
  ) || jsonb_build_object('updatedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at = now()
where id = 'me';

select
  s->>'dayName' as day, s->>'date' as date, s->>'startTime' as start, s->>'endTime' as "end"
from app_state, jsonb_array_elements(state->'sessions') as s
where id = 'me';
