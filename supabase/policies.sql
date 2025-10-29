-- Enable RLS
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.comments enable row level security;
alter table public.resources enable row level security;

-- Users
create policy "Read own user" on public.users for select using ((select auth.uid()) = id);
create policy "Insert own user" on public.users for insert with check ((select auth.uid()) = id);
create policy "Update own user" on public.users for update using ((select auth.uid()) = id);
create policy "Read basic users when authenticated" on public.users for select using ((select auth.role()) = 'authenticated');

-- Events
create policy "Read events" on public.events for select using (true);
create policy "Insert own events" on public.events for insert with check ((select auth.uid()) = created_by);
create policy "Update own events" on public.events for update using ((select auth.uid()) = created_by);
create policy "Delete own events" on public.events for delete using ((select auth.uid()) = created_by);

-- Registrations
create policy "Read own registrations" on public.registrations for select using ((select auth.uid()) = user_id);
create policy "Insert own registrations" on public.registrations for insert with check ((select auth.uid()) = user_id);
create policy "Delete own registrations" on public.registrations for delete using ((select auth.uid()) = user_id);
-- Organizers can view registrations for their events
create policy "Organizers read event registrations" on public.registrations
  for select using (exists (
    select 1 from public.events e where e.id = registrations.event_id and e.created_by = (select auth.uid())
  ));

-- Comments
create policy "Read comments" on public.comments for select using (true);
create policy "Insert own comments" on public.comments for insert with check ((select auth.uid()) = user_id);
create policy "Update own comments" on public.comments for update using ((select auth.uid()) = user_id);
create policy "Delete own comments" on public.comments for delete using ((select auth.uid()) = user_id);

-- Resources
create policy "Read resources" on public.resources for select using (true);
create policy "Insert resources (auth)" on public.resources for insert with check ((select auth.role()) = 'authenticated');
create policy "Update own resources" on public.resources for update using ((select auth.uid()) = uploaded_by);
create policy "Delete own resources" on public.resources for delete using ((select auth.uid()) = uploaded_by);


