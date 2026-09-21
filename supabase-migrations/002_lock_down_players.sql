-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Lock down the players table
-- Run this in Supabase SQL Editor
-- =========================================

-- Until now, if RLS was never enabled on `players`, anyone with your
-- site's public API key (visible in your page source -- this is
-- normal) had full read AND WRITE access to it, regardless of login
-- status. Now that the admin panel can edit/add/delete players, this
-- needs to actually be enforced, not just assumed.

alter table players enable row level security;

create policy "Players are viewable by everyone"
    on players for select
    using (true);

create policy "Only admins can insert players"
    on players for insert
    to authenticated
    with check (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );

create policy "Only admins can update players"
    on players for update
    to authenticated
    using (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );

create policy "Only admins can delete players"
    on players for delete
    to authenticated
    using (
        exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    );
