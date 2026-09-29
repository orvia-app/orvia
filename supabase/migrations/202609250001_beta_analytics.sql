-- First-party beta analytics. Apply after the tasks and feedback migrations.
begin;
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('landing_view','signup_started','signup_completed','email_confirmed','login_completed','first_task_created','feedback_submitted')),
  anonymous_id uuid,
  session_id uuid,
  authenticated boolean not null,
  user_id uuid references auth.users(id) on delete cascade,
  locale text check (locale in ('en','ua')),
  created_at timestamptz not null default now(),
  check (authenticated = (user_id is not null)),
  check ((anonymous_id is null) = (session_id is null)),
  check (event_name not in ('email_confirmed','login_completed','first_task_created','feedback_submitted') or user_id is not null),
  check (event_name in ('first_task_created','feedback_submitted') or (anonymous_id is not null and locale is not null))
);
alter table public.analytics_events enable row level security;
-- Deliberately no anon/authenticated policies or privileges, including own-row reads.
revoke all on public.analytics_events from public, anon, authenticated;
-- Override broad Supabase default grants before applying the intended access.
revoke all privileges on public.analytics_events from service_role;
grant select, insert on public.analytics_events to service_role;
create index analytics_events_created_idx on public.analytics_events (created_at);
create index analytics_events_anonymous_created_idx on public.analytics_events (anonymous_id, created_at);
create unique index analytics_events_once_per_user_idx on public.analytics_events (user_id, event_name)
  where event_name in ('first_task_created','email_confirmed');
create unique index analytics_events_once_per_session_idx on public.analytics_events (
  event_name, anonymous_id, session_id,
  (case when event_name in ('login_completed','email_confirmed') then user_id else null end)
) nulls not distinct where anonymous_id is not null;

create function public.ingest_beta_analytics(
  p_id uuid, p_event_name text, p_anonymous_id uuid, p_session_id uuid, p_locale text, p_user_id uuid
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_event_name not in ('landing_view','signup_started','signup_completed','email_confirmed','login_completed')
    or p_event_name is null or p_id is null or p_anonymous_id is null or p_session_id is null
    or p_locale is null or p_locale not in ('en','ua') then
    raise exception 'Invalid analytics event';
  end if;
  if p_event_name in ('email_confirmed','login_completed') and p_user_id is null then
    raise exception 'Authenticated analytics event required';
  end if;
  if p_event_name = 'email_confirmed' and not exists (
    select 1 from auth.users where id = p_user_id and email_confirmed_at is not null
  ) then raise exception 'Confirmed account required'; end if;
  -- Durable, privacy-safe budget. A single nonblocking lock bounds concurrent
  -- ingestion across server instances; no IP tracking or rate-limit identifiers.
  if not pg_try_advisory_xact_lock(724019251) then return false; end if;
  if (select count(*) from public.analytics_events where created_at >= now() - interval '1 minute') >= 600
    or (select count(*) from public.analytics_events where anonymous_id = p_anonymous_id and created_at >= now() - interval '1 minute') >= 30 then
    return false;
  end if;
  insert into public.analytics_events (id,event_name,anonymous_id,session_id,authenticated,user_id,locale)
    values (p_id,p_event_name,p_anonymous_id,p_session_id,p_user_id is not null,p_user_id,p_locale)
    on conflict do nothing;
  return true;
end;
$$;
revoke all on function public.ingest_beta_analytics(uuid,text,uuid,uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.ingest_beta_analytics(uuid,text,uuid,uuid,text,uuid) to service_role;

create function public.record_beta_task_activation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.analytics_events (event_name,authenticated,user_id)
    select 'first_task_created',true,created.user_id
    from (select distinct user_id from created_tasks where user_id is not null) created
    where not exists (
      select 1 from public.tasks existing where existing.user_id = created.user_id
        and not exists (select 1 from created_tasks batch where batch.id = existing.id)
    ) on conflict do nothing;
  return null;
exception when others then
  -- Optional telemetry must not roll back a successful product write.
  -- Fixed diagnostic only: never SQLERRM, row contents, or identifiers.
  raise warning 'Beta task analytics unavailable';
  return null;
end;
$$;
create trigger beta_task_activation after insert on public.tasks
  referencing new table as created_tasks
  for each statement execute function public.record_beta_task_activation();
revoke all on function public.record_beta_task_activation() from public, anon, authenticated;

create function public.record_beta_feedback_submission()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Source UUID makes a repeated trigger idempotent; no feedback body is read.
  insert into public.analytics_events (id,event_name,authenticated,user_id)
    values (new.id,'feedback_submitted',true,new.user_id) on conflict do nothing;
  return new;
exception when others then
  raise warning 'Beta feedback analytics unavailable';
  return new;
end;
$$;
create trigger beta_feedback_submission after insert on public.feedback
  for each row execute function public.record_beta_feedback_submission();
revoke all on function public.record_beta_feedback_submission() from public, anon, authenticated;

create function public.beta_analytics_report(p_days integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_days not in (7,30) or p_days is null then raise exception 'Invalid analytics period'; end if;
  with events as materialized (
    select event_name,anonymous_id,session_id,user_id,created_at from public.analytics_events
    where created_at >= (date_trunc('day', now() at time zone 'UTC') at time zone 'UTC') - (p_days - 1) * interval '1 day'
      and created_at <= now()
  ), names(name) as (values ('landing_view'),('signup_started'),('signup_completed'),('email_confirmed'),('login_completed'),('first_task_created'),('feedback_submitted')),
  counts as (select name, count(events.event_name) as total from names left join events on events.event_name = name group by name),
  days as (select generate_series((now() at time zone 'UTC')::date - (p_days-1), (now() at time zone 'UTC')::date, interval '1 day')::date as day),
  daily as (select day, count(events.event_name) as total from days left join events on (events.created_at at time zone 'UTC')::date = day group by day),
  -- Conversions count matching participants, not ratios of unrelated totals.
  -- Both steps must be observed in this period; these are not ordered cohorts.
  signup as (
    select distinct anonymous_id, session_id from events where event_name = 'signup_started'
  ), logged_in as (select distinct user_id from events where event_name = 'login_completed'),
  activated as (select distinct user_id from events where event_name = 'first_task_created')
  select jsonb_build_object(
    'counts', (select jsonb_object_agg(name,total) from counts),
    'daily', (select jsonb_agg(jsonb_build_object('date',day::text,'count',total) order by day) from daily),
    'conversions', jsonb_build_object(
      'signup', jsonb_build_object('denominator',(select count(*) from signup),'numerator',(
        select count(*) from signup s where exists (select 1 from events e where e.event_name = 'signup_completed' and e.anonymous_id = s.anonymous_id and e.session_id = s.session_id))),
      'activation', jsonb_build_object('denominator',(select count(*) from logged_in),'numerator',(
        select count(*) from logged_in l where exists (select 1 from activated a where a.user_id = l.user_id))),
      'feedback', jsonb_build_object('denominator',(select count(*) from activated),'numerator',(
        select count(*) from activated a where exists (select 1 from events e where e.event_name = 'feedback_submitted' and e.user_id = a.user_id)))
    )
  ) into result;
  return result;
end;
$$;
revoke all on function public.beta_analytics_report(integer) from public, anon, authenticated;
grant execute on function public.beta_analytics_report(integer) to service_role;
commit;
