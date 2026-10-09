-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Player nicknames
-- =========================================
--
-- An optional nickname for each player, for the Rinkside Report: Arnie
-- calls a player by his nickname if he has one, and by his last name if
-- he doesn't (see tools/recap/README.md).
--
-- Admins set it on the Players tab of the admin panel. The existing
-- "Only admins can ..." policies on `players` already cover it.
--
-- Already applied to the live database on 2026-10-09, along with the
-- first fourteen nicknames. This file is the record of it.

alter table public.players
    add column if not exists nickname text;

comment on column public.players.nickname is
    'Optional nickname used by the Rinkside Report. When NULL, use last_name.';
