-- A single owned claim serializes the final target of an account-backed capture.
-- The capture transition, claim, and destination insert run in one transaction.
create table public.capture_resolution_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_id uuid not null references public.captures(id) on delete cascade,
  target text not null check (target in ('task', 'note', 'event')),
  destination_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, capture_id),
  constraint capture_resolution_destination_identity check (destination_id = capture_id)
);

alter table public.capture_resolution_claims enable row level security;
revoke all on public.capture_resolution_claims from public, anon, authenticated;
grant select, insert on public.capture_resolution_claims to service_role;

-- Capture details remain readable from the resulting Event. Existing Events
-- and direct Calendar creation may leave this field null.
alter table public.orvia_events add column description text;
alter table public.orvia_events add constraint orvia_events_description_length
  check (description is null or length(description) <= 10000);

-- Disable the earlier unclaimed RPCs before enabling their claimed successors.
revoke execute on function public.resolve_capture_to_item(uuid, uuid, text) from service_role;
revoke execute on function public.resolve_capture_to_orvia_event(
  uuid, uuid, text, text, boolean, boolean, timestamptz, timestamptz, date, date
) from service_role;

create function public.resolve_claimed_capture_to_item(
  p_capture_id uuid, p_user_id uuid, p_target text
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_content text;
  v_claim_target text;
  v_title text;
  v_task public.tasks%rowtype;
  v_note public.notes%rowtype;
begin
  if p_target not in ('task', 'note') then
    raise exception 'Unsupported capture resolution target';
  end if;

  update public.captures set status = 'processed'
  where id = p_capture_id and user_id = p_user_id
    and status = 'inbox' and deleted_at is null
  returning content into v_content;

  select target into v_claim_target from public.capture_resolution_claims
  where user_id = p_user_id and capture_id = p_capture_id;
  if v_claim_target is not null then
    if v_claim_target is distinct from p_target then
      return jsonb_build_object('status', 'conflict');
    end if;
    if p_target = 'task' then
      select * into v_task from public.tasks
      where id = p_capture_id and user_id = p_user_id;
      if not found then return jsonb_build_object('status', 'conflict'); end if;
      return jsonb_build_object('status', 'existing', 'item', to_jsonb(v_task));
    end if;
    select * into v_note from public.notes
    where id = p_capture_id and user_id = p_user_id;
    if not found then return jsonb_build_object('status', 'conflict'); end if;
    return jsonb_build_object('status', 'existing', 'item', to_jsonb(v_note));
  end if;
  if v_content is null then return jsonb_build_object('status', 'conflict'); end if;

  v_title := left(btrim(coalesce(nullif(btrim(split_part(v_content, E'\n', 1)), ''), v_content)), 240);
  if length(v_title) = 0 then raise exception 'Capture title is empty'; end if;
  if p_target = 'task' and length(v_content) > 5000 then
    raise exception 'Capture exceeds Task description limit';
  end if;

  insert into public.capture_resolution_claims(user_id, capture_id, target, destination_id)
  values (p_user_id, p_capture_id, p_target, p_capture_id);
  if p_target = 'task' then
    insert into public.tasks(id, user_id, title, description, status, priority, workspace_id)
    values (p_capture_id, p_user_id, v_title, v_content, 'todo', 'medium', '1')
    returning * into v_task;
    return jsonb_build_object('status', 'created', 'item', to_jsonb(v_task));
  end if;
  insert into public.notes(id, user_id, title, content, type, source)
  values (p_capture_id, p_user_id, v_title, v_content, 'note', 'api')
  returning * into v_note;
  return jsonb_build_object('status', 'created', 'item', to_jsonb(v_note));
end;
$$;

revoke all on function public.resolve_claimed_capture_to_item(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.resolve_claimed_capture_to_item(uuid, uuid, text)
  to service_role;

create function public.resolve_claimed_capture_to_event(
  p_capture_id uuid, p_user_id uuid, p_title text, p_description text,
  p_timezone text, p_busy boolean, p_all_day boolean,
  p_start_at timestamptz, p_end_at timestamptz,
  p_start_date date, p_end_date_exclusive date
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_capture_id uuid;
  v_claim_target text;
  v_event public.orvia_events%rowtype;
begin
  update public.captures set status = 'processed'
  where id = p_capture_id and user_id = p_user_id
    and status = 'inbox' and deleted_at is null
  returning id into v_capture_id;

  select target into v_claim_target from public.capture_resolution_claims
  where user_id = p_user_id and capture_id = p_capture_id;
  if v_claim_target is not null then
    if v_claim_target is distinct from 'event' then
      return jsonb_build_object('status', 'conflict');
    end if;
    select * into v_event from public.orvia_events
    where id = p_capture_id and user_id = p_user_id;
    if not found then return jsonb_build_object('status', 'conflict'); end if;
    return jsonb_build_object('status', 'existing', 'item', to_jsonb(v_event));
  end if;
  if v_capture_id is null then return jsonb_build_object('status', 'conflict'); end if;

  insert into public.capture_resolution_claims(user_id, capture_id, target, destination_id)
  values (p_user_id, p_capture_id, 'event', p_capture_id);
  insert into public.orvia_events (
    id, user_id, title, description, timezone, busy, all_day,
    start_at, end_at, start_date, end_date_exclusive, lifecycle_status
  ) values (
    p_capture_id, p_user_id, p_title, p_description, p_timezone, p_busy, p_all_day,
    p_start_at, p_end_at, p_start_date, p_end_date_exclusive, 'active'
  ) returning * into v_event;
  return jsonb_build_object('status', 'created', 'item', to_jsonb(v_event));
end;
$$;

revoke all on function public.resolve_claimed_capture_to_event(
  uuid, uuid, text, text, text, boolean, boolean, timestamptz, timestamptz, date, date
) from public, anon, authenticated;
grant execute on function public.resolve_claimed_capture_to_event(
  uuid, uuid, text, text, text, boolean, boolean, timestamptz, timestamptz, date, date
) to service_role;
