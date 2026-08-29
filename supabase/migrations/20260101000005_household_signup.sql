-- Signup flow for a 2-person household (replaces the old hardcoded-email gate).
-- First person to sign up creates a household and becomes 'owner'. The owner
-- shares the household id (shown in the app) as an invite code; the second
-- person pastes it at signup to join as 'partner'. security definer so these
-- can run before the caller has a profiles row of their own (which the
-- households/profiles RLS policies would otherwise require).

create or replace function create_household_and_owner(p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Profile already exists for this user';
  end if;

  insert into households (name) values (coalesce(p_display_name, 'Household') || ' - Household')
  returning id into v_household_id;

  insert into profiles (id, household_id, role, display_name)
  values (auth.uid(), v_household_id, 'owner', p_display_name);

  return v_household_id;
end;
$$;

grant execute on function create_household_and_owner(text) to authenticated;

create or replace function join_household(p_household_id uuid, p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Profile already exists for this user';
  end if;

  if not exists (select 1 from households where id = p_household_id) then
    raise exception 'Invalid invite code';
  end if;

  if exists (select 1 from profiles where household_id = p_household_id and role = 'partner') then
    raise exception 'This household already has a partner';
  end if;

  insert into profiles (id, household_id, role, display_name)
  values (auth.uid(), p_household_id, 'partner', p_display_name);
end;
$$;

grant execute on function join_household(uuid, text) to authenticated;
