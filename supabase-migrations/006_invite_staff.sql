-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Invite somebody who isn't a player
-- =========================================
--
-- The Admin page invites players off the roster. A timekeeper who doesn't
-- play has no roster line, so this is how he gets a login: it sends him
-- the usual invitation email and, if asked, gives the new account the
-- timekeeper role (see 004_timekeeper_role.sql) in the same breath.
--
-- From the Supabase SQL Editor:
--
--   select private.invite_staff('someone@example.com', true);   -- true = make them a timekeeper
--
-- It only works for an address that has no account yet. For somebody who
-- already has a login, use the update in 004 instead.
--
-- Needs 005_recap_email.sql (the http extension, the private schema and
-- the shared secret) and the invite-staff Edge Function.

create or replace function private.invite_staff(
    p_email text,
    p_timekeeper boolean default false
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
    v_response jsonb;
    v_user_id uuid;
begin
    select value into v_secret from public.app_config where key = 'recap_email_secret';
    if v_secret is null then
        raise exception 'app_config.recap_email_secret is missing';
    end if;

    perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '30000');

    select r.status, r.content
      into v_status, v_content
      from extensions.http((
          'POST',
          'https://wjsxpywxwjordtzzjrue.supabase.co/functions/v1/invite-staff',
          array[extensions.http_header('x-recap-secret', v_secret)],
          'application/json',
          jsonb_build_object('email', p_email)::text
      )::extensions.http_request) r;

    begin
        v_response := v_content::jsonb;
    exception when others then
        return jsonb_build_object('http_status', v_status, 'response', v_content);
    end;

    if v_status = 200 and p_timekeeper and (v_response->>'user_id') is not null then
        v_user_id := (v_response->>'user_id')::uuid;

        insert into public.profiles (id, is_admin, is_timekeeper)
        values (v_user_id, false, true)
        on conflict (id) do update set is_timekeeper = true;
    end if;

    return jsonb_build_object('http_status', v_status, 'response', v_response, 'timekeeper', v_status = 200 and p_timekeeper);
end;
$$;

revoke all on function private.invite_staff(text, boolean) from public, anon, authenticated;
