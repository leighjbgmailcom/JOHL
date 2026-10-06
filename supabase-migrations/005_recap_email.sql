-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Rinkside Report email
-- =========================================
--
-- The plumbing for emailing the weekly recap link (see
-- supabase-functions/send-recap-email and tools/recap/README.md).
--
-- Nothing here is reachable from the website: the three tables have row
-- level security on and no policies (so only the service role can touch
-- them), and the function lives in a schema the API doesn't expose.
--
-- To send, from the Supabase SQL Editor:
--
--   select private.send_recap_email('info');                                   -- sends nothing, just checks the setup
--   select private.send_recap_email('test', '2026-10-04', 'you@example.com');  -- one admin's own address
--   select private.send_recap_email('all',  '2026-10-04');                     -- every player on the active season
--
-- 'all' is refused until it's switched on:
--
--   update public.app_config set value = 'true' where key = 'recap_email_all_enabled';
--
-- To take somebody off the list:
--
--   insert into public.recap_email_optouts (email) values ('someone@example.com');

create extension if not exists http with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;


-- Settings the recap emailer reads. Locked: no policies.
create table if not exists public.app_config (
    key text primary key,
    value text not null,
    updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

insert into public.app_config (key, value) values
    -- The password the database shows the Edge Function. Made up here, never shown anywhere.
    ('recap_email_secret', encode(extensions.gen_random_bytes(32), 'hex')),
    -- Who the email comes from. Has to be on a domain verified in Resend.
    ('recap_email_from', 'JOHL Rinkside Report <noreply@jordanohl.ca>'),
    -- Whole-league sends stay off until the league says go.
    ('recap_email_all_enabled', 'false')
on conflict (key) do nothing;


-- A line for every send, so the same recap can't go to the league twice.
create table if not exists public.recap_email_sends (
    id bigint generated always as identity primary key,
    recap_date date not null,
    mode text not null,
    recipient_count integer not null default 0,
    ok boolean not null default false,
    detail jsonb,
    created_at timestamptz not null default now()
);
alter table public.recap_email_sends enable row level security;
revoke all on public.recap_email_sends from anon, authenticated;


-- Anyone who's asked not to get the recap email.
create table if not exists public.recap_email_optouts (
    email text primary key,
    created_at timestamptz not null default now()
);
alter table public.recap_email_optouts enable row level security;
revoke all on public.recap_email_optouts from anon, authenticated;


create or replace function private.send_recap_email(
    p_mode text,
    p_date date default null,
    p_to text default null,
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
          jsonb_build_object('mode', p_mode, 'date', p_date, 'to', p_to, 'force', p_force)::text
      )::extensions.http_request) r;

    return jsonb_build_object('http_status', v_status, 'response', v_content::jsonb);
exception
    when invalid_text_representation then
        return jsonb_build_object('http_status', v_status, 'response', v_content);
end;
$$;

revoke all on function private.send_recap_email(text, date, text, boolean) from public, anon, authenticated;
