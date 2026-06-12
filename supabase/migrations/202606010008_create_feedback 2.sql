-- Orvia in-product beta feedback foundation.
--
-- Feedback contains user-entered text, so access is intentionally narrow:
-- authenticated users can create and read only their own feedback. Normal users
-- cannot update/delete feedback rows. Service role can manage rows for future
-- internal review tooling without weakening owner-only user access.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'general',
  message text not null,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint feedback_type_check
    check (type in ('bug', 'idea', 'confusing', 'missing_feature', 'general')),
  constraint feedback_status_check
    check (status in ('new', 'reviewed', 'planned', 'closed')),
  constraint feedback_message_length_check
    check (length(btrim(message)) between 1 and 5000),
  constraint feedback_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.feedback is
  'User-owned private beta feedback submitted from the Orvia app.';
comment on column public.feedback.message is
  'User-entered feedback text. Do not copy into logs, analytics, activities, or monitoring metadata.';
comment on column public.feedback.metadata is
  'Small allowlisted operational context only, such as route, locale, theme, or source.';

create index feedback_user_id_idx
  on public.feedback (user_id);

create index feedback_created_at_idx
  on public.feedback (created_at desc);

create index feedback_type_idx
  on public.feedback (type);

create index feedback_status_idx
  on public.feedback (status);

alter table public.feedback enable row level security;

create policy feedback_select_own on public.feedback
  for select
  to authenticated
  using (user_id = auth.uid());

create policy feedback_insert_own on public.feedback
  for insert
  to authenticated
  with check (user_id = auth.uid());

grant usage on schema public to authenticated, service_role;

grant select, insert
  on public.feedback
  to authenticated;

grant select, insert, update, delete
  on public.feedback
  to service_role;

revoke all on table public.feedback from anon;
