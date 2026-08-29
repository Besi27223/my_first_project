export type UserRole = "owner" | "partner";
export type DeductionType = "reduces_taxable_profit" | "reduces_tax";

export interface Household {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  household_id: string;
  role: UserRole;
  display_name: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  short_name: string;
  tax_pct: number;
  deduction_type: DeductionType;
  icon_key: string;
  color_hex: string;
  sort_order: number;
  created_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  created_by: string;
  description: string;
  invoice_number: string | null;
  expense_date: string;
  tax_year: number;
  amount: number;
  category_id: string;
  tax_pct_snapshot: number;
  notes: string | null;
  receipt_paths: string[];
  archive_ref_id: string | null;
  dropbox_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  expense_categories: ExpenseCategory;
}

export interface ExpenseArchive {
  id: string;
  expense_id: string;
  household_id: string;
  created_by: string;
  supplier_name: string | null;
  invoice_number: string | null;
  vat_amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface MonthlyIncome {
  id: string;
  household_id: string;
  created_by: string;
  gross_amount: number;
  net_amount: number;
  tax_year: number;
  month: number;
  reference_doc_paths: string[];
  dropbox_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportSummary {
  not_taxed: number;
  annual_credit: number;
  expected_refund: number;
  total_income: number;
}

export interface ReportChartRow {
  category_id: string;
  short_name: string;
  color_hex: string;
  recognized_amount: number;
}
