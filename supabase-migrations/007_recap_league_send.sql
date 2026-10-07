-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Rinkside Report: the whole-league send
-- =========================================
--
-- Emailing every player is its own function, so it can't happen by
-- passing the wrong word to private.send_recap_email (which is now only
-- for 'info' and 'test'). It has to be told who in the league approved
-- that week's recap, and that name is kept in recap_email_sends.
--
--   select private.send_recap_to_league('2026-10-04', 'Leigh Brown');
--
-- It only sends to players it hasn't already reached with that recap, so
-- if a send stops part way (the day's email allowance ran out, say) the
-- same line run again later finishes the job without anyone getting it
-- twice. The recap has to be published first: a recap still marked
-- "draft" in recaps/recaps.json is refused.
--
-- The master switch is still app_config.recap_email_all_enabled.

create or replace function private.send_recap_to_league(
    p_date date,
    p_approved_by text,
    p_force boolean default false
)
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
    if p_date is null then
        raise exception 'Which recap? Give the game date.';
    end if;
    if coalesce(trim(p_approved_by), '') = '' then
        raise exception 'Say who in the league approved sending this recap.';
    end if;

    select value into v_secret from public.app_config where key = 'recap_email_secret';
    if v_secret is null then
        raise exception 'app_config.recap_email_secret is missing';
    end if;

    perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '60000');

    select r.status, r.content
      into v_status, v_content
      from extensions.http((
          'POST',
          'https://wjsxpywxwjordtzzjrue.supabase.co/functions/v1/send-recap-email',
          array[extensions.http_header('x-recap-secret', v_secret)],
          'application/json',
          jsonb_build_object('mode', 'all', 'date', p_date, 'approved_by', trim(p_approved_by), 'force', p_force)::text
      )::extensions.http_request) r;

    begin
        return jsonb_build_object('http_status', v_status, 'response', v_content::jsonb);
    exception when others then
        return jsonb_build_object('http_status', v_status, 'response', v_content);
    end;
end;
$$;

revoke all on function private.send_recap_to_league(date, text, boolean) from public, anon, authenticated;
