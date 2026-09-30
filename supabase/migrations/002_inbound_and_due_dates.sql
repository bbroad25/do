-- DO migration 002: inbound task import (webhooks / Shortcuts / IFTTT / future
-- connectors), due dates, and the triage inbox.
--
-- Reconciled with the handoff schema:
--   * handoff "domains"  -> existing public.categories (no swipe_direction; DO uses an N-way dial)
--   * handoff "ease"     -> existing tasks.effort
--   * handoff completed_at -> existing tasks.done / done_at
--   * token verification happens inside Postgres (ingest_inbound), so the API
--     route needs only the public key -- no service-role secret in Vercel.

-- ---------------------------------------------------------------- tasks
alter table public.tasks
  add column if not exists notes              text,
  add column if not exists due_at             timestamptz,
  add column if not exists triage_state       text not null default 'triaged',
  add column if not exists source             text not null default 'manual',
  add column if not exists source_external_id text not null default gen_random_uuid()::text,
  add column if not exists source_list        text,
  add column if not exists source_url         text,
  add column if not exists raw                jsonb,
  add column if not exists updated_at         timestamptz not null default now();

alter table public.tasks
  add constraint tasks_triage_state_check check (triage_state in ('inbox', 'triaged'));

-- imports arrive with no category until triaged; triaged tasks must have one
alter table public.tasks alter column category_id drop not null;
alter table public.tasks
  add constraint tasks_triaged_has_category check (triage_state = 'inbox' or category_id is not null);

-- idempotency key for every inbound source
alter table public.tasks
  add constraint tasks_source_external_unique unique (user_id, source, source_external_id);

create index if not exists tasks_inbox_idx
  on public.tasks (user_id, created_at)
  where triage_state = 'inbox' and done = false;

-- ---------------------------------------------------------------- inbound tokens
-- Token format: 'do_' + 32 random bytes (base64url). Only the SHA-256 hash is stored.
create table if not exists public.inbound_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  token_hash   text not null unique,
  label        text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
create index if not exists inbound_tokens_user_id_idx on public.inbound_tokens (user_id);

alter table public.inbound_tokens enable row level security;
create policy "inbound_tokens: select own" on public.inbound_tokens
  for select using ((select auth.uid()) = user_id);
-- no insert/update/delete policies: creation and revocation go through the functions below

-- ---------------------------------------------------------------- the one write path
-- Re-syncs refresh source-owned fields (title, notes, due date, completion) but never
-- touch DO's map fields (category, urgency, importance, effort, triage_state), and
-- never un-complete a task.
create or replace function public.upsert_inbound_tasks(p_user_id uuid, p_items jsonb)
returns table (task_id uuid, task_source text, external_id text, was_inserted boolean)
language sql
set search_path = ''
as $$
  insert into public.tasks as t
    (user_id, category_id, triage_state, source, source_external_id, title, notes,
     due_at, done, done_at, source_list, source_url, raw)
  select
    p_user_id, null, 'inbox',
    i->>'source', i->>'external_id', i->>'title', i->>'notes',
    nullif(i->>'due_at', '')::timestamptz,
    nullif(i->>'completed_at', '') is not null,
    nullif(i->>'completed_at', '')::timestamptz,
    i->>'list', i->>'url', i
  from jsonb_array_elements(p_items) as i
  on conflict (user_id, source, source_external_id) do update set
    title       = excluded.title,
    notes       = excluded.notes,
    due_at      = excluded.due_at,
    done        = t.done or excluded.done,
    done_at     = coalesce(t.done_at, excluded.done_at),
    source_list = excluded.source_list,
    source_url  = excluded.source_url,
    raw         = excluded.raw,
    updated_at  = now()
  returning t.id, t.source, t.source_external_id, (t.xmax = 0);
$$;
revoke all on function public.upsert_inbound_tasks(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_inbound_tasks(uuid, jsonb) to service_role;

-- Called by POST /api/inbound with the caller's raw token. Verifies it, validates the
-- batch (defense in depth -- the route validates too), then writes.
create or replace function public.ingest_inbound(p_token text, p_items jsonb)
returns table (task_id uuid, was_inserted boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_id uuid;
  v_user_id  uuid;
begin
  if p_token is null or left(p_token, 3) <> 'do_' then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  select id, user_id into v_token_id, v_user_id
  from public.inbound_tokens
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and revoked_at is null;

  if v_user_id is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 100
     or exists (
       select 1 from jsonb_array_elements(p_items) i
       where coalesce(length(trim(i->>'title')), 0) not between 1 and 500
          or coalesce(length(i->>'source'), 0) not between 1 and 40
          or coalesce(length(i->>'external_id'), 0) not between 1 and 200
          or length(coalesce(i->>'notes', '')) > 10000
     ) then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  update public.inbound_tokens set last_used_at = now() where id = v_token_id;

  return query
    select u.task_id, u.was_inserted
    from public.upsert_inbound_tasks(v_user_id, p_items) u;
end;
$$;
revoke all on function public.ingest_inbound(text, jsonb) from public, anon, authenticated;
grant execute on function public.ingest_inbound(text, jsonb) to anon, authenticated;

-- Signed-in user creates a token; the plaintext is returned exactly once.
create or replace function public.create_inbound_token(p_label text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_token text;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if (select count(*) from public.inbound_tokens where user_id = v_uid and revoked_at is null) >= 10 then
    raise exception 'too many active tokens' using errcode = '54000';
  end if;
  v_token := 'do_' || translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
  insert into public.inbound_tokens (user_id, token_hash, label)
  values (v_uid, encode(extensions.digest(v_token, 'sha256'), 'hex'), left(nullif(trim(p_label), ''), 60));
  return v_token;
end;
$$;
revoke all on function public.create_inbound_token(text) from public, anon, authenticated;
grant execute on function public.create_inbound_token(text) to authenticated;

create or replace function public.revoke_inbound_token(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.inbound_tokens
  set revoked_at = now()
  where id = p_id and user_id = auth.uid() and revoked_at is null;
$$;
revoke all on function public.revoke_inbound_token(uuid) from public, anon, authenticated;
grant execute on function public.revoke_inbound_token(uuid) to authenticated;

-- The webhook never has a signed-in user, so signed-in callers do not need ingest.
revoke execute on function public.ingest_inbound(text, jsonb) from authenticated;
