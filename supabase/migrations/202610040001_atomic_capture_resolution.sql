-- A capture and its Event resolve in one database transaction. This function is
-- called only by the authenticated server route using the server-only service role.
create function public.resolve_capture_to_orvia_event(
  p_capture_id uuid,
  p_user_id uuid,
  p_title text,
  p_timezone text,
  p_busy boolean,
  p_all_day boolean,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_start_date date,
  p_end_date_exclusive date
) returns setof public.orvia_events
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_capture_id uuid;
begin
  update public.captures
  set status = 'processed'
  where id = p_capture_id and user_id = p_user_id
    and status = 'inbox' and deleted_at is null
  returning id into v_capture_id;

  if v_capture_id is null then
    return;
  end if;

  return query
    insert into public.orvia_events (
      id, user_id, title, timezone, busy, all_day,
      start_at, end_at, start_date, end_date_exclusive, lifecycle_status
    ) values (
      p_capture_id, p_user_id, p_title, p_timezone, p_busy, p_all_day,
      p_start_at, p_end_at, p_start_date, p_end_date_exclusive, 'active'
    ) returning *;
end;
$$;

revoke all on function public.resolve_capture_to_orvia_event(
  uuid, uuid, text, text, boolean, boolean, timestamptz, timestamptz, date, date
) from public, anon, authenticated;
grant execute on function public.resolve_capture_to_orvia_event(
  uuid, uuid, text, text, boolean, boolean, timestamptz, timestamptz, date, date
) to service_role;

-- Task and Note resolutions use the same capture lock and lifecycle transition.
-- The inserted shapes match the existing minimal Task/Note creation contracts.
create function public.resolve_capture_to_item(
  p_capture_id uuid,
  p_user_id uuid,
  p_target text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_content text;
  v_title text;
  v_task public.tasks%rowtype;
  v_note public.notes%rowtype;
begin
  if p_target not in ('task', 'note') then
    raise exception 'Unsupported capture resolution target';
  end if;

  update public.captures
  set status = 'processed'
  where id = p_capture_id and user_id = p_user_id
    and status = 'inbox' and deleted_at is null
  returning content into v_content;

  if v_content is null then
    return null;
  end if;

  v_title := left(btrim(coalesce(nullif(btrim(split_part(v_content, E'\n', 1)), ''), v_content)), 240);
  if length(v_title) = 0 then
    raise exception 'Capture title is empty';
  end if;

  if p_target = 'task' then
    if length(v_content) > 5000 then
      raise exception 'Capture exceeds Task description limit';
    end if;
    insert into public.tasks (id, user_id, title, description, status, priority, workspace_id)
    values (p_capture_id, p_user_id, v_title, v_content, 'todo', 'medium', '1')
    returning * into v_task;
    return to_jsonb(v_task);
  end if;

  insert into public.notes (id, user_id, title, content, type, source)
  values (p_capture_id, p_user_id, v_title, v_content, 'note', 'api')
  returning * into v_note;
  return to_jsonb(v_note);
end;
$$;

revoke all on function public.resolve_capture_to_item(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.resolve_capture_to_item(uuid, uuid, text)
  to service_role;
