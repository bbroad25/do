-- DO app schema for Supabase (Postgres)
-- Run this once in the Supabase SQL editor for a new project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created automatically on signup (see trigger below)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  accent text not null default '#ff6b5e',
  notifications boolean not null default false,
  streak integer not null default 0,
  best_streak integer not null default 0,
  points integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles
  for insert with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- categories: the draggable domains shown on the home dial
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  icon text not null default 'flag',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: select own" on public.categories
  for select using ((select auth.uid()) = user_id);
create policy "categories: insert own" on public.categories
  for insert with check ((select auth.uid()) = user_id);
create policy "categories: update own" on public.categories
  for update using ((select auth.uid()) = user_id);
create policy "categories: delete own" on public.categories
  for delete using ((select auth.uid()) = user_id);

create index if not exists categories_user_id_idx on public.categories (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- tasks: sit on the urgency x importance map inside a category
-- category_id is intentionally NOT ON DELETE CASCADE — the app reassigns a
-- category's tasks to another category before it lets you delete it, so a
-- stray delete can never silently wipe someone's tasks.
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null,
  urgency numeric not null default 0.5 check (urgency >= 0 and urgency <= 1),
  importance numeric not null default 0.5 check (importance >= 0 and importance <= 1),
  effort numeric not null default 0.5 check (effort >= 0 and effort <= 1),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks: select own" on public.tasks
  for select using ((select auth.uid()) = user_id);
create policy "tasks: insert own" on public.tasks
  for insert with check ((select auth.uid()) = user_id);
create policy "tasks: update own" on public.tasks
  for update using ((select auth.uid()) = user_id);
create policy "tasks: delete own" on public.tasks
  for delete using ((select auth.uid()) = user_id);

create index if not exists tasks_user_id_idx on public.tasks (user_id, category_id, done);
create index if not exists tasks_category_id_idx on public.tasks (category_id);

-- ---------------------------------------------------------------------------
-- integrations: stub toggles for now (real OAuth connections come later)
-- ---------------------------------------------------------------------------
create table if not exists public.integrations (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  enabled boolean not null default false,
  primary key (user_id, key)
);

alter table public.integrations enable row level security;

create policy "integrations: select own" on public.integrations
  for select using ((select auth.uid()) = user_id);
create policy "integrations: upsert own" on public.integrations
  for insert with check ((select auth.uid()) = user_id);
create policy "integrations: update own" on public.integrations
  for update using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- New-user setup: create a profile, six default categories, and a few
-- starter tasks so the app isn't empty the first time someone signs in.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  cat_work uuid;
  cat_fun uuid;
  cat_family uuid;
  cat_self uuid;
  cat_give uuid;
  cat_other uuid;
begin
  insert into public.profiles (id) values (new.id);

  insert into public.categories (user_id, label, icon, sort_order)
    values (new.id, 'work', 'work', 0) returning id into cat_work;
  insert into public.categories (user_id, label, icon, sort_order)
    values (new.id, 'fun', 'fun', 1) returning id into cat_fun;
  insert into public.categories (user_id, label, icon, sort_order)
    values (new.id, 'family', 'family', 2) returning id into cat_family;
  insert into public.categories (user_id, label, icon, sort_order)
    values (new.id, 'self', 'self', 3) returning id into cat_self;
  insert into public.categories (user_id, label, icon, sort_order)
    values (new.id, 'give', 'give', 4) returning id into cat_give;
  insert into public.categories (user_id, label, icon, sort_order)
    values (new.id, 'other', 'other', 5) returning id into cat_other;

  insert into public.tasks (user_id, category_id, title, urgency, importance, effort) values
    (new.id, cat_work, 'Ship the release notes', 0.82, 0.78, 0.5),
    (new.id, cat_work, 'Clean up the backlog', 0.22, 0.66, 0.8),
    (new.id, cat_fun, 'Book the summer trip', 0.35, 0.55, 0.5),
    (new.id, cat_family, 'Plan the birthday party', 0.68, 0.86, 0.5),
    (new.id, cat_self, 'Actually stretch today', 0.6, 0.4, 0.28),
    (new.id, cat_give, 'Pick a cause to back', 0.2, 0.45, 0.5);

  insert into public.integrations (user_id, key, enabled) values
    (new.id, 'inbox', true),
    (new.id, 'calendar', false),
    (new.id, 'reminders', false),
    (new.id, 'slack', false);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- handle_new_user only needs to run as the trigger's owner. Without this,
-- Supabase's PostgREST layer auto-exposes it as a public RPC endpoint
-- (/rest/v1/rpc/handle_new_user) simply for living in the public schema.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
