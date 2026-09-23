-- The categories dropdown showing no options (just the placeholder) with no
-- error means the query itself succeeds but returns zero rows — most likely
-- explanation: this project's expense_categories table was never seeded
-- (e.g. only later migrations were run by hand). This re-inserts the same
-- seed from 20260101000002_seed_categories.sql, skipping rows that already
-- exist by name, so it's safe to run even if the table is already populated.

insert into expense_categories (name, short_name, tax_pct, deduction_type, icon_key, color_hex, sort_order)
select v.name, v.short_name, v.tax_pct, v.deduction_type::deduction_type, v.icon_key, v.color_hex, v.sort_order
from (
  values
    ('עסק / השכלה', 'עסק', 1.00, 'reduces_taxable_profit', 'biz', '#6a32d6', 1),
    ('רכב', 'רכב', 0.45, 'reduces_taxable_profit', 'car', '#1f54c9', 2),
    ('טלפון / אינטרנט', 'טלפון', 0.50, 'reduces_taxable_profit', 'phone', '#0c93a8', 3),
    ('ארוחות ואירוח', 'כיבוד', 0.50, 'reduces_taxable_profit', 'host', '#e07a12', 4),
    ('הוצאות בית', 'בית', 0.20, 'reduces_taxable_profit', 'home', '#128a52', 5),
    ('תרומות', 'תרומות', 0.35, 'reduces_tax', 'donate', '#d9305f', 6),
    ('הפרשות לפנסיה וקרן השתלמות', 'חסכונות', 0.35, 'reduces_taxable_profit', 'savings', '#c79412', 7)
) as v(name, short_name, tax_pct, deduction_type, icon_key, color_hex, sort_order)
where not exists (
  select 1 from expense_categories ec where ec.name = v.name
);
