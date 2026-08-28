-- S.O.M — schema
-- households, profiles (owner/partner), expense_categories, expenses,
-- expense_archive (rich accountant archive), monthly_income.

create extension if not exists "pgcrypto";

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Household',
  created_at timestamptz not null default now()
);

create type user_role as enum ('owner', 'partner');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  role user_role not null default 'partner',
  display_name text not null,
  created_at timestamptz not null default now()
);

create index profiles_household_id_idx on profiles (household_id);

create type deduction_type as enum ('reduces_taxable_profit', 'reduces_tax');

-- Global category taxonomy (owner-editable in a future "settings" screen).
create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  tax_pct numeric(5, 4) not null,
  deduction_type deduction_type not null,
  icon_key text not null,
  color_hex text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  created_by uuid not null references profiles (id),
  description text not null check (char_length(description) <= 100 and char_length(description) > 0),
  invoice_number text,
  expense_date date not null default current_date,
  tax_year int not null,
  amount numeric(10, 2) not null check (amount <> 0 and amount >= -999999 and amount <= 999999),
  category_id uuid not null references expense_categories (id),
  tax_pct_snapshot numeric(5, 4) not null,
  notes text,
  receipt_paths text[] not null default '{}',
  archive_ref_id uuid,
  dropbox_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_household_tax_year_idx on expenses (household_id, tax_year);
create index expenses_category_idx on expenses (category_id);
create index expenses_created_by_idx on expenses (created_by);

-- Rich accountant archive, one row per expense (decision #5: keep both destinations).
create table expense_archive (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  created_by uuid not null references profiles (id),
  supplier_name text,
  invoice_number text,
  vat_amount numeric(10, 2),
  notes text,
  created_at timestamptz not null default now()
);

alter table expenses
  add constraint expenses_archive_ref_fk foreign key (archive_ref_id) references expense_archive (id) on delete set null;

create index expense_archive_expense_id_idx on expense_archive (expense_id);

create table monthly_income (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  created_by uuid not null references profiles (id),
  gross_amount numeric(10, 2) not null check (gross_amount >= 0),
  net_amount numeric(10, 2) not null check (net_amount >= 0),
  tax_year int not null,
  month int not null check (month between 1 and 12),
  reference_doc_paths text[] not null default '{}',
  dropbox_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index monthly_income_household_tax_year_idx on monthly_income (household_id, tax_year);

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at before update on expenses
  for each row execute function set_updated_at();

create trigger monthly_income_set_updated_at before update on monthly_income
  for each row execute function set_updated_at();
