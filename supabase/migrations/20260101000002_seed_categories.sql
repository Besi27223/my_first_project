-- Category taxonomy — א.3.1. icon_key/color_hex map to the design guide assets
-- in public/assets/icons/{listicon,tag,icon}-{icon_key}.svg.

insert into expense_categories (name, short_name, tax_pct, deduction_type, icon_key, color_hex, sort_order) values
  ('עסק / השכלה', 'עסק', 1.00, 'reduces_taxable_profit', 'biz', '#6a32d6', 1),
  ('רכב', 'רכב', 0.45, 'reduces_taxable_profit', 'car', '#1f54c9', 2),
  ('טלפון / אינטרנט', 'טלפון', 0.50, 'reduces_taxable_profit', 'phone', '#0c93a8', 3),
  ('ארוחות ואירוח', 'כיבוד', 0.50, 'reduces_taxable_profit', 'host', '#e07a12', 4),
  ('הוצאות בית', 'בית', 0.20, 'reduces_taxable_profit', 'home', '#128a52', 5),
  ('תרומות', 'תרומות', 0.35, 'reduces_tax', 'donate', '#d9305f', 6),
  ('הפרשות לפנסיה וקרן השתלמות', 'חסכונות', 0.35, 'reduces_taxable_profit', 'savings', '#c79412', 7);
