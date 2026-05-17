alter table public.profiles
  add column if not exists total_xp integer not null default 0,
  add column if not exists current_level integer not null default 1;

update public.profiles
set
  current_level = coalesce(current_level, level, 1),
  total_xp = coalesce(total_xp, 0);

create index if not exists profiles_total_xp_idx on public.profiles (total_xp desc);
create index if not exists profiles_current_level_idx on public.profiles (current_level desc);
