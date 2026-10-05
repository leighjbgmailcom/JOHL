-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Goalies recorded the way the score sheet does it
-- (already applied to the live database on 2026-10-04)
-- =========================================
--
-- game_goalie_periods used to hold when each goalie went IN
-- (period + time_in). The paper score sheet records the opposite: the
-- time written beside a goalie is when he CAME OUT. The table now
-- matches the sheet:
--
--   one row per goalie per time in net, in the order they played
--   period   = the period he came out in   ('1', '2', '3', 'OT')
--   time_out = the clock time he came out  ('9:48')
--   both NULL for the goalie who finished the game
--
-- Example, a team that changed goalies at 9:48 of the 2nd:
--   (goalie A, period '2', time_out '9:48')
--   (goalie B, period NULL, time_out NULL)
--
-- time_in is no longer read or written by the site. It has been left in
-- place (all NULL) rather than dropped.

alter table public.game_goalie_periods
    add column if not exists time_out text;

alter table public.game_goalie_periods
    alter column period drop not null;

comment on column public.game_goalie_periods.period is
    'Period this goalie CAME OUT in (1, 2, 3, OT). NULL if he finished the game.';
comment on column public.game_goalie_periods.time_out is
    'Clock time (M:SS) this goalie CAME OUT, as written on the score sheet. NULL if he finished the game.';
comment on column public.game_goalie_periods.time_in is
    'Retired 2026-10-04 -- replaced by time_out. No longer read or written by the site.';


-- One-time conversion of the games entered under the old layout
-- (2026-09-27 and 2026-10-04): each goalie's "came out" is the next
-- goalie's old "went in", and the last goalie gets no time.
--
--   with ordered as (
--       select id,
--              lead(period)  over w as out_period,
--              lead(time_in) over w as out_time
--       from public.game_goalie_periods
--       where game_id in (23, 26, 54, 47, 36)
--       window w as (
--           partition by game_id, team_id
--           order by array_position(array['1','2','3','OT','SO'], period),
--                    (time_in is not null), id
--       )
--   )
--   update public.game_goalie_periods g
--   set period = o.out_period, time_out = o.out_time, time_in = null
--   from ordered o
--   where o.id = g.id;
