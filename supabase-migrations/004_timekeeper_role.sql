-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Timekeeper role
-- =========================================
--
-- A second role beside is_admin: a timekeeper can open the Score Sheet
-- (sheet.html) and record a game on it -- goals, penalties, goalies,
-- who was on the ice, and the game's score / status -- and nothing else.
-- He can't touch players, teams, the schedule or sponsors unless he's
-- also an admin.
--
-- To make somebody a timekeeper (they need a site login first), run
-- this in the Supabase SQL Editor with their login email:
--
--   update profiles set is_timekeeper = true
--   where id = (select id from auth.users where email = 'someone@example.com');
--
-- and set it back to false to take the role away.

alter table public.profiles
    add column if not exists is_timekeeper boolean not null default false;

comment on column public.profiles.is_timekeeper is
    'Timekeeper role: can open the Score Sheet and record games on it.';


-- -----------------------------------------
-- What a timekeeper may write
-- -----------------------------------------
-- These sit beside the existing "Only admins can ..." policies; a row is
-- writable if either one lets it through.

create policy "Timekeepers can insert goals"
    on public.game_goals for insert to authenticated
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can update goals"
    on public.game_goals for update to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true))
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can delete goals"
    on public.game_goals for delete to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can insert penalties"
    on public.game_penalties for insert to authenticated
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can update penalties"
    on public.game_penalties for update to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true))
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can delete penalties"
    on public.game_penalties for delete to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can write goalie periods"
    on public.game_goalie_periods for all to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true))
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can insert attendance"
    on public.game_attendance for insert to authenticated
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

create policy "Timekeepers can delete attendance"
    on public.game_attendance for delete to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));

-- A timekeeper can update a game (never add or delete one)...
create policy "Timekeepers can update games"
    on public.games for update to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true))
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_timekeeper = true));


-- -----------------------------------------
-- ...but only its score, status and overtime flag
-- -----------------------------------------
-- Row level security can't say "these columns only", so this trigger
-- does: a timekeeper who isn't also an admin can change away_score,
-- home_score, status and went_ot on a game and nothing else (not its
-- date, time, teams or rink). Admins, and changes made from the
-- Supabase dashboard, pass straight through.

create or replace function public.games_timekeeper_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    v_admin boolean;
    v_timekeeper boolean;
begin
    if auth.uid() is null then
        return new;
    end if;

    select p.is_admin, p.is_timekeeper
      into v_admin, v_timekeeper
      from public.profiles p
     where p.id = auth.uid();

    if coalesce(v_admin, false) then
        return new;
    end if;

    if coalesce(v_timekeeper, false)
       and (to_jsonb(new) - array['away_score', 'home_score', 'status', 'went_ot'])
           is distinct from
           (to_jsonb(old) - array['away_score', 'home_score', 'status', 'went_ot'])
    then
        raise exception 'Timekeepers can only change a game''s score, status and overtime flag.';
    end if;

    return new;
end;
$$;

create trigger games_timekeeper_guard
    before update on public.games
    for each row
    execute function public.games_timekeeper_guard();
