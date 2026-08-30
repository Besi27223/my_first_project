-- expense_categories is non-sensitive taxonomy data (names/colors/icons),
-- not household data — no reason to gate reads behind auth.role() at all.
-- Simplifies away any ambiguity in how that evaluated for a given session.

drop policy if exists categories_select on expense_categories;

create policy categories_select on expense_categories
  for select using (true);
