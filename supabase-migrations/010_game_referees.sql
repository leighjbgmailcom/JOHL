-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Referees on the Score Sheet
-- =========================================
--
-- The league's list of refs, and the two who worked each game. The
-- timekeeper picks them from a drop-down on the Score Sheet; a ref who
-- isn't on the list yet can be added right from that drop-down.
--
-- To tidy the list from the SQL Editor:
--
--   update referees set name = 'Corrected Name' where name = 'Old Name';
--   update referees set active = false where name = 'Retired Ref';  -- drops off the drop-down, stays on old games

create table if not exists public.referees (
    id bigint generated always as identity primary key,
    name text not null,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create unique index if not exists referees_name_key on public.referees (lower(name));

comment on table public.referees is 'Referees the timekeeper can pick on the Score Sheet.';

alter table public.referees enable row level security;

create policy "Signed-in users can read referees"
    on public.referees for select to authenticated
    using (true);

create policy "Timekeepers and admins can add referees"
    on public.referees for insert to authenticated
    with check (exists (
        select 1 from public.profiles
        where id = auth.uid() and (is_timekeeper = true or is_admin = true)
    ));

create policy "Admins can change referees"
    on public.referees for update to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


-- -----------------------------------------
-- The two refs on each game
-- -----------------------------------------

alter table public.games
    add column if not exists referee_1_id bigint references public.referees (id) on delete set null,
    add column if not exists referee_2_id bigint references public.referees (id) on delete set null;


-- -----------------------------------------
-- Let a timekeeper write them
-- -----------------------------------------
-- Same guard as 004, with the two ref columns added to what a
-- timekeeper may change.

create or replace function public.games_timekeeper_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    v_admin boolean;
    v_timekeeper boolean;
    v_allowed text[] := array['away_score', 'home_score', 'status', 'went_ot', 'referee_1_id', 'referee_2_id'];
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
       and (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed)
    then
        raise exception 'Timekeepers can only change a game''s score, status, overtime flag and referees.';
    end if;

    return new;
end;
$$;
