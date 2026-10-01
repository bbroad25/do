-- DO migration 003: product reporting.
-- Users write anonymous-by-design usage events (never task titles or content);
-- only admins can read aggregates, via admin_report().

create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  props      jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2000),
  created_at timestamptz not null default now()
);
create index if not exists events_name_created_idx on public.events (name, created_at);
create index if not exists events_user_created_idx on public.events (user_id, created_at);

alter table public.events enable row level security;
create policy "events: insert own" on public.events
  for insert with check ((select auth.uid()) = user_id);
-- no select policy: nobody reads raw events through the API

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
-- lets the app know whether to show the Reports screen; grants nothing else
create policy "admins: see own row" on public.admins
  for select using ((select auth.uid()) = user_id);

create or replace function public.admin_report(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_since    timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
  v_tracking timestamptz := (select min(created_at) from public.events);
  v          jsonb;
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with e as (select * from public.events where created_at >= v_since)
  select jsonb_build_object(
    'since', v_since,
    'users_total', (select count(*) from auth.users),
    'active_users', (select count(distinct user_id) from e),
    'returning_users', (select count(*) from (
        select user_id from e group by user_id having count(distinct created_at::date) >= 2) r),
    'sessions', (select count(*) from e where name = 'session_start'),
    'sessions_desktop', (select count(*) from e where name = 'session_start' and (props->>'desktop')::boolean),
    'sessions_installed', (select count(*) from e where name = 'session_start' and (props->>'installed')::boolean),
    'tasks_added', (select count(*) from e where name = 'task_added'),
    'tasks_completed', (select count(*) from e where name = 'task_completed'),
    'completed_via', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (
        select coalesce(props->>'via', 'unknown') k, count(*) n from e where name = 'task_completed' group by 1) x),
    'board_opened_via', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (
        select coalesce(props->>'via', 'unknown') k, count(*) n from e where name = 'board_opened' group by 1) x),
    'time_filter', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (
        select coalesce(props->>'budget', 'unknown') k, count(*) n from e where name = 'time_filter_set' group by 1) x),
    'suggest_opened', (select count(*) from e where name = 'suggest_opened'),
    'suggest_done', (select count(*) from e where name = 'task_completed' and props->>'via' = 'suggest'),
    'suggest_another', (select count(*) from e where name = 'suggest_another'),
    'triage_sorted', (select count(*) from e where name = 'triage_sorted'),
    'median_minutes_to_first_task', (
        select round((percentile_cont(0.5) within group (order by greatest(0, extract(epoch from (f.first_at - u.created_at)) / 60)))::numeric, 1)
        from auth.users u
        join (select user_id, min(created_at) as first_at from public.events where name = 'task_added' group by 1) f
          on f.user_id = u.id
        where v_tracking is not null and u.created_at >= v_tracking),
    'daily', (select coalesce(jsonb_agg(d order by d->>'day'), '[]'::jsonb) from (
        select jsonb_build_object(
          'day', created_at::date,
          'active', count(distinct user_id),
          'added', count(*) filter (where name = 'task_added'),
          'completed', count(*) filter (where name = 'task_completed')) d
        from e group by created_at::date) dd)
  ) into v;
  return v;
end;
$$;
revoke all on function public.admin_report(int) from public, anon, authenticated;
grant execute on function public.admin_report(int) to authenticated;
