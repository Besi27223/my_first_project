-- Backend-computed report aggregation (decision #8): every KPI/chart number
-- shown in the app is "the recognized amount" (amount * tax_pct), computed
-- here — never re-derived in the client. security invoker (default), so the
-- caller's RLS on expenses/monthly_income still applies.

create or replace function report_summary(p_tax_year int)
returns table (
  not_taxed numeric,
  annual_credit numeric,
  expected_refund numeric,
  total_income numeric
)
language sql
stable
as $$
  select
    coalesce((
      select sum(e.amount * e.tax_pct_snapshot)
      from expenses e
      join expense_categories c on c.id = e.category_id
      where e.tax_year = p_tax_year and c.deduction_type = 'reduces_taxable_profit'
    ), 0) as not_taxed,
    coalesce((
      select sum(e.amount * e.tax_pct_snapshot)
      from expenses e
      join expense_categories c on c.id = e.category_id
      where e.tax_year = p_tax_year and c.deduction_type = 'reduces_tax'
    ), 0) as annual_credit,
    coalesce((
      select sum(e.amount * e.tax_pct_snapshot)
      from expenses e
      join expense_categories c on c.id = e.category_id
      where e.tax_year = p_tax_year and c.deduction_type = 'reduces_tax'
    ), 0) * 0.35 as expected_refund,
    coalesce((
      select sum(mi.gross_amount)
      from monthly_income mi
      where mi.tax_year = p_tax_year
    ), 0) as total_income;
$$;

grant execute on function report_summary(int) to authenticated;

create or replace function report_chart(p_tax_year int)
returns table (
  category_id uuid,
  short_name text,
  color_hex text,
  recognized_amount numeric
)
language sql
stable
as $$
  select
    c.id,
    c.short_name,
    c.color_hex,
    coalesce(sum(e.amount * e.tax_pct_snapshot), 0) as recognized_amount
  from expense_categories c
  left join expenses e on e.category_id = c.id and e.tax_year = p_tax_year
  group by c.id, c.short_name, c.color_hex, c.sort_order
  order by c.sort_order;
$$;

grant execute on function report_chart(int) to authenticated;
