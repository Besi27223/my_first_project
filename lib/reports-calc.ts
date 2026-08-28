import type { Expense, ExpenseCategory, MonthlyIncome, ReportChartRow, ReportSummary } from "@/lib/types/database";

// Pure mirror of supabase/migrations/20260101000003_reports_functions.sql
// (report_summary / report_chart). In real mode those Postgres functions are
// the single source of truth; this copy exists only so demo mode — which has
// no backend — can show the same numbers computed the same way (decision #8:
// "the recognized amount", never a raw sum).

export function computeReportSummary(
  expenses: Expense[],
  income: MonthlyIncome[],
  categories: ExpenseCategory[],
  taxYear: number,
): ReportSummary {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const yearExpenses = expenses.filter((e) => e.tax_year === taxYear);

  const recognized = (deductionType: ExpenseCategory["deduction_type"]) =>
    yearExpenses
      .filter((e) => categoryById.get(e.category_id)?.deduction_type === deductionType)
      .reduce((sum, e) => sum + e.amount * e.tax_pct_snapshot, 0);

  const notTaxed = recognized("reduces_taxable_profit");
  const annualCredit = recognized("reduces_tax");
  const totalIncome = income
    .filter((i) => i.tax_year === taxYear)
    .reduce((sum, i) => sum + i.gross_amount, 0);

  return {
    not_taxed: notTaxed,
    annual_credit: annualCredit,
    expected_refund: annualCredit * 0.35,
    total_income: totalIncome,
  };
}

export function computeReportChart(
  expenses: Expense[],
  categories: ExpenseCategory[],
  taxYear: number,
): ReportChartRow[] {
  const yearExpenses = expenses.filter((e) => e.tax_year === taxYear);

  return [...categories]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      category_id: c.id,
      short_name: c.short_name,
      color_hex: c.color_hex,
      recognized_amount: yearExpenses
        .filter((e) => e.category_id === c.id)
        .reduce((sum, e) => sum + e.amount * e.tax_pct_snapshot, 0),
    }));
}
