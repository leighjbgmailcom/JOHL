-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Arnie answers comments twice a day (not instantly)
-- =========================================
--
-- Leigh's call: Arnie doesn't fire back the moment a comment lands.
-- The "JOHL Arnie answers comments" scheduled task runs at lunch and
-- supper time, reads any comments he hasn't answered, writes each reply
-- in his voice, and posts it with private.arnie_reply() -- which saves it
-- under the comment and emails the player (Edge Function arnie-reply).
--
--   select * from private.arnie_unanswered();          -- what's waiting
--   select private.arnie_reply(42, 'Arnie''s words');  -- answer one
--
-- The instant trigger from 013 stays, switched off:
update public.app_config set value = 'false' where key = 'arnie_replies_enabled';

-- Players' comments Arnie hasn't answered yet, oldest first, with the
-- recap they're under.
create or replace function private.arnie_unanswered()
returns table (comment_id bigint, recap_date date, author_name text, body text, created_at timestamptz)
language sql
security definer
set search_path = ''
as $$
    select c.id, c.recap_date, c.author_name, c.body, c.created_at
      from public.recap_comments c
     where not c.is_arnie
       and c.reply_to is null
       and not exists (select 1 from public.recap_comments r where r.reply_to = c.id and r.is_arnie)
     order by c.created_at;
$$;

-- Posts Arnie's reply to one comment and emails the player.
create or replace function private.arnie_reply(p_comment_id bigint, p_reply text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_secret text;
    v_status integer;
    v_content text;
begin
    if coalesce(btrim(p_reply), '') = '' then
        raise exception 'Arnie needs something to say';
    end if;

    select value into v_secret from public.app_config where key = 'recap_email_secret';

    perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '30000');
    select r.status, r.content
      into v_status, v_content
      from extensions.http((
          'POST',
          'https://wjsxpywxwjordtzzjrue.supabase.co/functions/v1/arnie-reply',
          array[extensions.http_header('x-recap-secret', v_secret)],
          'application/json',
          jsonb_build_object('comment_id', p_comment_id, 'reply', p_reply)::text
      )::extensions.http_request) r;

    return jsonb_build_object('http_status', v_status, 'response', v_content::jsonb);
exception
    when invalid_text_representation then
        return jsonb_build_object('http_status', v_status, 'response', v_content);
end;
$$;

revoke all on function private.arnie_unanswered() from public, anon, authenticated;
revoke all on function private.arnie_reply(bigint, text) from public, anon, authenticated;
