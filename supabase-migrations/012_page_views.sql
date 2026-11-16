-- =========================================
-- JORDAN OLDTIMERS HOCKEY LEAGUE
-- Site traffic (page views and recap plays)
-- =========================================
--
-- Every page on jordanohl.ca writes one row here when it opens
-- (js/header.js), and the Rinkside Report writes one when someone
-- presses play. No cookies and nothing personal: the "visitor" is a
-- random code the browser makes up and keeps, so a person who comes
-- back is counted once, not every time.
--
-- Anyone can add a row; nobody can read the rows directly. League
-- admins see the totals through public.traffic_summary(days), which
-- the Traffic tab on admin.html calls.

create table if not exists public.page_views (
    id         bigint generated always as identity primary key,
    at         timestamptz not null default now(),
    kind       text not null default 'view' check (kind in ('view', 'play')),
    page       text not null check (char_length(page) between 1 and 60),
    detail     text check (detail is null or char_length(detail) <= 40),
    visitor    text not null check (char_length(visitor) between 8 and 40),
    referrer   text check (referrer is null or char_length(referrer) <= 100),
    device     text check (device in ('phone', 'tablet', 'computer')),
    signed_in  boolean not null default false
);

create index if not exists page_views_at_idx on public.page_views (at);

-- The time is always the database's own.
create or replace function private.page_view_defaults()
returns trigger
language plpgsql
as $$
begin
    new.at := now();
    return new;
end;
$$;

drop trigger if exists page_view_defaults on public.page_views;
create trigger page_view_defaults
    before insert on public.page_views
    for each row execute function private.page_view_defaults();

alter table public.page_views enable row level security;

drop policy if exists "Anyone can record a page view" on public.page_views;
create policy "Anyone can record a page view"
    on public.page_views for insert
    to anon, authenticated
    with check (true);

revoke all on public.page_views from anon, authenticated;
grant insert (kind, page, detail, visitor, referrer, device, signed_in) on public.page_views to anon, authenticated;

-- Totals for the admin Traffic tab. Admins only.
create or replace function public.traffic_summary(days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    since timestamptz := (date_trunc('day', now() at time zone 'America/Toronto') - make_interval(0, 0, 0, greatest(days, 1) - 1)) at time zone 'America/Toronto';
    result jsonb;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
        raise exception 'Admins only';
    end if;

    with v as (
        select *, (at at time zone 'America/Toronto')::date as day
          from public.page_views
         where at >= since
    )
    select jsonb_build_object(
        'since', (since at time zone 'America/Toronto')::date,
        'visitors', (select count(distinct visitor) from v where kind = 'view'),
        'views', (select count(*) from v where kind = 'view'),
        'plays', (select count(*) from v where kind = 'play'),
        'today_visitors', (select count(distinct visitor) from v where kind = 'view' and day = (now() at time zone 'America/Toronto')::date),
        'by_day', coalesce((
            select jsonb_agg(jsonb_build_object('day', d.day, 'visitors', d.visitors, 'views', d.views) order by d.day)
              from (
                select gs::date as day,
                       count(distinct v.visitor) filter (where v.kind = 'view') as visitors,
                       count(v.id) filter (where v.kind = 'view') as views
                  from generate_series((since at time zone 'America/Toronto')::date, (now() at time zone 'America/Toronto')::date, interval '1 day') gs
                  left join v on v.day = gs::date
                 group by gs
              ) d
        ), '[]'::jsonb),
        'by_page', coalesce((
            select jsonb_agg(jsonb_build_object('page', p.page, 'visitors', p.visitors, 'views', p.views) order by p.views desc)
              from (select page, count(distinct visitor) visitors, count(*) views from v where kind = 'view' group by page) p
        ), '[]'::jsonb),
        'recaps', coalesce((
            select jsonb_agg(jsonb_build_object('date', r.detail, 'visitors', r.visitors, 'plays', r.plays) order by r.detail desc)
              from (
                select detail,
                       count(distinct visitor) filter (where kind = 'view') visitors,
                       count(*) filter (where kind = 'play') plays
                  from v where detail is not null and (page = 'recaps' or kind = 'play') group by detail
              ) r
        ), '[]'::jsonb),
        'devices', coalesce((
            select jsonb_object_agg(coalesce(device, 'unknown'), n)
              from (select device, count(distinct visitor) n from v where kind = 'view' group by device) dv
        ), '{}'::jsonb),
        'referrers', coalesce((
            select jsonb_agg(jsonb_build_object('from', rf.referrer, 'visits', rf.n) order by rf.n desc)
              from (select referrer, count(*) n from v where kind = 'view' and referrer is not null group by referrer order by n desc limit 8) rf
        ), '[]'::jsonb),
        'signed_in_visitors', (select count(distinct visitor) from v where kind = 'view' and signed_in)
    ) into result;

    return result;
end;
$$;

revoke all on function public.traffic_summary(integer) from public, anon;
grant execute on function public.traffic_summary(integer) to authenticated;
