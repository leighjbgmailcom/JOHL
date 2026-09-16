-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Admin roles + game results schema
-- Run this in Supabase SQL Editor
-- =========================================

-- -----------------------------------------
-- 1. ADMIN ROLES
-- One row per authenticated user, flagging
-- who is allowed to enter game results.
-- -----------------------------------------

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    is_admin boolean not null default false,
    created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Anyone logged in can read profiles (needed so the site can check
-- "is the current user an admin?" client-side).
create policy "Profiles are viewable by authenticated users"
    on profiles for select
    to authenticated
    using (true);

-- Automatically create a profile (is_admin = false by default) the
-- moment someone accepts an invite / signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, is_admin)
    values (new.id, false)
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- IMPORTANT: after running this, back-fill a profile row for any
-- users who already existed before this trigger was created, e.g.:
--
--   insert into profiles (id, is_admin)
--   select id, false from auth.users
--   on conflict (id) do nothing;
--
-- Then promote yourself to admin:
--
--   update profiles set is_admin = true where id =
--     (select id from auth.users where email = 'you@example.com');


-- -----------------------------------------
-- 2. GOALS
-- One row per goal scored, tied to a game.
-- -----------------------------------------

create table if not exists game_goals (
    id bigint generated always as identity primary key,
    game_id bigint not null references games(id) on delete cascade,
    team_id bigint not null references teams(id),
    scorer_id bigint references players(id),
    assist1_id bigint references players(id),
    assist2_id bigint references players(id),
    period text not null,      -- '1', '2', '3', 'OT', 'SO'
    game_time text,            -- e.g. "12:34"
    created_at timestamptz not null default now()
);

alter table game_goals enable row level security;

create policy "Goals are viewable by everyone"
    on game_goals for select
    using (true);

create policy "Only admins can insert goals"
    on game_goals for insert
    to authenticated
    with check (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );

create policy "Only admins can update goals"
    on game_goals for update
    to authenticated
    using (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );

create policy "Only admins can delete goals"
    on game_goals for delete
    to authenticated
    using (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );


-- -----------------------------------------
-- 3. PENALTIES
-- One row per penalty, tied to a game.
-- -----------------------------------------

create table if not exists game_penalties (
    id bigint generated always as identity primary key,
    game_id bigint not null references games(id) on delete cascade,
    team_id bigint not null references teams(id),
    player_id bigint references players(id),
    infraction text,
    minutes integer not null default 2,
    period text not null,
    game_time text,
    created_at timestamptz not null default now()
);

alter table game_penalties enable row level security;

create policy "Penalties are viewable by everyone"
    on game_penalties for select
    using (true);

create policy "Only admins can insert penalties"
    on game_penalties for insert
    to authenticated
    with check (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );

create policy "Only admins can update penalties"
    on game_penalties for update
    to authenticated
    using (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );

create policy "Only admins can delete penalties"
    on game_penalties for delete
    to authenticated
    using (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );


-- -----------------------------------------
-- 4. GAMES TABLE
-- Only admins should be able to mark a game
-- final / edit its status or scores.
-- (Adjust/remove if you already have a
-- write policy on games.)
-- -----------------------------------------

alter table games enable row level security;

create policy "Games are viewable by everyone"
    on games for select
    using (true);

create policy "Only admins can update games"
    on games for update
    to authenticated
    using (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );


-- -----------------------------------------
-- 5. TEAMS / PLAYERS / SPONSORS
-- Recommended: lock these down the same way.
-- If RLS was never enabled on these tables,
-- anyone with your public API key (visible in
-- your site's source -- this is normal and
-- expected) currently has full read AND WRITE
-- access to them, admin or not. Uncomment and
-- run this block to fix that.
-- -----------------------------------------

-- alter table teams enable row level security;
-- create policy "Teams are viewable by everyone" on teams for select using (true);
-- create policy "Only admins can write teams" on teams for all to authenticated
--     using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
--     with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- alter table players enable row level security;
-- create policy "Players are viewable by everyone" on players for select using (true);
-- create policy "Only admins can write players" on players for all to authenticated
--     using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
--     with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- alter table sponsors enable row level security;
-- create policy "Sponsors are viewable by everyone" on sponsors for select using (true);
-- create policy "Only admins can write sponsors" on sponsors for all to authenticated
--     using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
--     with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

