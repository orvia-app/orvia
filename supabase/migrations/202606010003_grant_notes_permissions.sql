grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on public.notes
  to authenticated;

grant select, insert, update, delete
  on public.notes
  to service_role;
