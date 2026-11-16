-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Comments on the Rinkside Report
-- =========================================
--
-- Under each recap on recaps.html, league members can leave a comment.
-- Anyone can read them; only someone signed in to the site can post,
-- and the name shown is filled in here from the players table (his
-- nickname, or first and last name) by matching his sign-in email, so
-- nobody can post as somebody else. A member can delete his own
-- comment; an admin can delete any.

create table if not exists public.recap_comments (
    id          bigint generated always as identity primary key,
    recap_date  date not null,
    author_id   uuid default auth.uid() references auth.users (id) on delete set null,
    author_name text not null default 'League member',
    body        text not null check (char_length(btrim(body)) between 1 and 600),
    created_at  timestamptz not null default now()
);

create index if not exists recap_comments_date_idx on public.recap_comments (recap_date, created_at);

-- The poster and his name always come from his own sign-in.
create or replace function private.recap_comment_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    who text;
begin
    new.author_id := auth.uid();
    new.body := btrim(new.body);
    new.created_at := now();

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

drop trigger if exists recap_comment_author on public.recap_comments;
create trigger recap_comment_author
    before insert on public.recap_comments
    for each row execute function private.recap_comment_author();

alter table public.recap_comments enable row level security;

drop policy if exists "Recap comments are viewable by everyone" on public.recap_comments;
create policy "Recap comments are viewable by everyone"
    on public.recap_comments for select
    using (true);

drop policy if exists "Signed-in members can comment" on public.recap_comments;
create policy "Signed-in members can comment"
    on public.recap_comments for insert
    to authenticated
    with check (true);

drop policy if exists "Members delete their own comments, admins any" on public.recap_comments;
create policy "Members delete their own comments, admins any"
    on public.recap_comments for delete
    to authenticated
    using (
        author_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );

grant select on public.recap_comments to anon, authenticated;
grant insert (recap_date, body), delete on public.recap_comments to authenticated;
