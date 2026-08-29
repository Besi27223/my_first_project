-- Storage bucket for receipts / income reference docs (ב.4).
-- Path convention: {household_id}/{tax_year}/{bi_monthly_period | 'תרומות'}/{filename}

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts household select" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth_household_id()::text
  );

create policy "receipts household insert" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth_household_id()::text
  );

create policy "receipts owner or uploader update" on storage.objects
  for update using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth_household_id()::text
    and (auth_role() = 'owner' or owner = auth.uid())
  );

create policy "receipts owner or uploader delete" on storage.objects
  for delete using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth_household_id()::text
    and (auth_role() = 'owner' or owner = auth.uid())
  );
