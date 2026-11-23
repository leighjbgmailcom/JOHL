-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Arnie replies to comments on the Rinkside Report
-- =========================================
--
-- When a player leaves a comment under a recap, Arnie Jordan writes back
-- under it, and the player gets an email saying Arnie replied.
--
--   1. A player posts a comment (recaps.html).
--   2. The trigger below hands the comment's id to the Edge Function
--      arnie-reply (supabase-functions/arnie-reply), without making the
--      player wait for it (pg_net runs the call in the background).
--   3. arnie-reply writes Arnie's answer as a reply to that comment
--      (is_arnie = true, reply_to = the comment) and emails the player.
--
-- Only the Edge Function (service role) can post as Arnie: a player's
-- insert always has is_arnie forced off and his own name filled in.
-- Deleting a comment takes Arnie's reply to it with it.
--
-- To stop Arnie replying (the trigger stays, it just does nothing):
--   update public.app_config set value = 'false' where key = 'arnie_replies_enabled';

create extension if not exists pg_net with schema extensions;

alter table public.recap_comments
    add column if not exists reply_to bigint references public.recap_comments (id) on delete cascade,
    add column if not exists is_arnie boolean not null default false;

create index if not exists recap_comments_reply_to_idx on public.recap_comments (reply_to);

insert into public.app_config (key, value) values ('arnie_replies_enabled', 'true')
on conflict (key) do nothing;


-- Players post as themselves; only the service role may post as Arnie.
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

    if coalesce(auth.role(), '') = 'service_role' and new.is_arnie then
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


-- After a player's comment is saved, ask Arnie to answer it.
create or replace function private.recap_comment_ask_arnie()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_secret text;
    v_on text;
begin
    if new.is_arnie then
        return new;
    end if;

    select value into v_on from public.app_config where key = 'arnie_replies_enabled';
    if coalesce(v_on, 'false') <> 'true' then
        return new;
    end if;

    select value into v_secret from public.app_config where key = 'recap_email_secret';
    if v_secret is null then
        return new;
    end if;

    perform net.http_post(
        url     := 'https://wjsxpywxwjordtzzjrue.supabase.co/functions/v1/arnie-reply',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-recap-secret', v_secret),
        body    := jsonb_build_object('comment_id', new.id),
        timeout_milliseconds := 30000
    );
    return new;
exception
    when others then
        -- Never lose a player's comment because Arnie couldn't be reached.
        raise warning 'arnie-reply call failed: %', sqlerrm;
        return new;
end;
$$;

revoke all on function private.recap_comment_ask_arnie() from public, anon, authenticated;

drop trigger if exists recap_comment_ask_arnie on public.recap_comments;
create trigger recap_comment_ask_arnie
    after insert on public.recap_comments
    for each row execute function private.recap_comment_ask_arnie();
