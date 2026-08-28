-- Row Level Security — implements א.4 (decision #4):
-- Owner edits/deletes everything in the household; Partner only their own records.

create or replace function auth_household_id() returns uuid
language sql stable security definer set search_path = public as $$
  select household_id from profiles where id = auth.uid()
$$;

create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

alter table households enable row level security;
alter table profiles enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table expense_archive enable row level security;
alter table monthly_income enable row level security;

-- households
create policy households_select on households
  for select using (id = auth_household_id());

-- profiles: household members can see each other; a user can only update their own row.
create policy profiles_select on profiles
  for select using (household_id = auth_household_id());

create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_insert_self on profiles
  for insert with check (id = auth.uid());

-- expense_categories: everyone (authenticated) reads; only Owner writes.
create policy categories_select on expense_categories
  for select using (auth.role() = 'authenticated');

create policy categories_owner_write on expense_categories
  for all using (auth_role() = 'owner') with check (auth_role() = 'owner');

-- expenses
create policy expenses_select on expenses
  for select using (household_id = auth_household_id());

create policy expenses_insert on expenses
  for insert with check (household_id = auth_household_id() and created_by = auth.uid());

create policy expenses_update on expenses
  for update using (
    household_id = auth_household_id()
    and (auth_role() = 'owner' or created_by = auth.uid())
  ) with check (household_id = auth_household_id());

create policy expenses_delete on expenses
  for delete using (
    household_id = auth_household_id()
    and (auth_role() = 'owner' or created_by = auth.uid())
  );

-- expense_archive: mirrors expenses permissions.
create policy expense_archive_select on expense_archive
  for select using (household_id = auth_household_id());

create policy expense_archive_insert on expense_archive
  for insert with check (household_id = auth_household_id() and created_by = auth.uid());

create policy expense_archive_update on expense_archive
  for update using (
    household_id = auth_household_id()
    and (auth_role() = 'owner' or created_by = auth.uid())
  ) with check (household_id = auth_household_id());

create policy expense_archive_delete on expense_archive
  for delete using (
    household_id = auth_household_id()
    and (auth_role() = 'owner' or created_by = auth.uid())
  );

-- monthly_income: mirrors expenses permissions.
create policy monthly_income_select on monthly_income
  for select using (household_id = auth_household_id());

create policy monthly_income_insert on monthly_income
  for insert with check (household_id = auth_household_id() and created_by = auth.uid());

create policy monthly_income_update on monthly_income
  for update using (
    household_id = auth_household_id()
    and (auth_role() = 'owner' or created_by = auth.uid())
  ) with check (household_id = auth_household_id());

create policy monthly_income_delete on monthly_income
  for delete using (
    household_id = auth_household_id()
    and (auth_role() = 'owner' or created_by = auth.uid())
  );
