-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Arnie can post a comment of his own under a recap
-- =========================================
--
-- Used for one-off notes from Arnie (e.g. the Movember fundraiser link
-- under the Nov 22, 2026 report). Only the database itself (SQL Editor,
-- scheduled tasks) or the service role can post as Arnie; a signed-in
-- player's comment is always his own.
--
--   select private.arnie_post('2026-11-22', 'Arnie''s note, with a link https://...');

create or replace function private.recap_comment_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    who text;
begin
    new.body := btrim(new.body);
    new.created_at := now();

    -- No website login behind it (service role or the database itself).
    if new.is_arnie and coalesce(auth.role(), 'service_role') = 'service_role' then
        new.author_id := null;
        new.author_name := 'Arnie Jordan';
        return new;
    end if;

    new.author_id := auth.uid();
    new.is_arnie := false;
    new.reply_to := null;

    select coalesce(nullif(btrim(p.nickname), ''), btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')))
      into who
      from public.players p
     where p.email is not null
       and lower(p.email) = lower(auth.jwt() ->> 'email')
     order by p.season_id desc nulls last
     limit 1;

    new.author_name := coalesce(nullif(who, ''), 'League member');
    return new;
end;
$$;

create or replace function private.arnie_post(p_date date, p_body text)
returns bigint
language sql
security definer
set search_path = ''
as $$
    insert into public.recap_comments (recap_date, body, is_arnie)
    values (p_date, p_body, true)
    returning id;
$$;

revoke all on function private.arnie_post(date, text) from public, anon, authenticated;
