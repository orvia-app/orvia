alter table public.activities
  drop constraint if exists activities_type_check;

alter table public.activities
  add constraint activities_type_check
  check (
    type in (
      'task_created',
      'task_updated',
      'task_completed',
      'task_deleted',
      'note_created',
      'note_updated',
      'note_deleted',
      'inbox_processed',
      'quick_capture_created',
      'local_import_completed',
      'system_event'
    )
  );
