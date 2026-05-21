create or replace function public.gympace_min_xp_for_level(target_level integer)
returns integer
language plpgsql
immutable
as $$
declare
  total integer := 0;
  current_level integer;
begin
  if coalesce(target_level, 1) <= 1 then
    return 0;
  end if;

  for current_level in 2..target_level loop
    total := total + round(150 * power(1.16, current_level - 2))::integer;
  end loop;

  return total;
end;
$$;

update public.profiles
set
  current_level = coalesce(current_level, level, 1),
  level = coalesce(current_level, level, 1),
  total_xp = public.gympace_min_xp_for_level(coalesce(current_level, level, 1)),
  rank = case
    when coalesce(current_level, level, 1) >= 30 then 'elite'
    when coalesce(current_level, level, 1) >= 22 then 'platinum'
    when coalesce(current_level, level, 1) >= 15 then 'gold'
    when coalesce(current_level, level, 1) >= 8 then 'silver'
    when coalesce(current_level, level, 1) >= 3 then 'bronze'
    else 'rookie'
  end
where coalesce(total_xp, 0) = 0
  and coalesce(current_level, level, 1) > 1;

drop function public.gympace_min_xp_for_level(integer);
