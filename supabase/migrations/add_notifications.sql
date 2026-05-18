create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  data jsonb
);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id)
  where read = false;

alter table public.notifications enable row level security;

create policy "users_read_own_notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "users_update_own_notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Authenticated users can insert notifications (API code enforces valid scenarios)
create policy "authenticated_insert_notifications"
  on public.notifications for insert
  to authenticated
  with check (true);
