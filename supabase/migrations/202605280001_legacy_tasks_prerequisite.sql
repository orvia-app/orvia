-- Reconstructed prerequisite verified against production schema metadata.
-- Records the existing foundation; this is not historical execution provenance.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  workspace_id text,
  created_at timestamptz not null default now()
);
