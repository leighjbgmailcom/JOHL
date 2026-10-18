-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- When a penalized player came back on
-- =========================================
--
-- The Score Sheet works out the ON time from the OFF time and the length
-- of the penalty. When it didn't go that way (he came back early on a
-- power-play goal, say), the timekeeper writes the time in, and it's kept
-- here as clock text ("4:32"). Empty means the worked-out time stands.
-- A time higher on the clock than the OFF time is in the next period.

alter table public.game_penalties
    add column if not exists time_on text;

comment on column public.game_penalties.time_on is
    'Time on the clock the player came back on, when the timekeeper wrote it in. Null = OFF time plus the penalty length.';
