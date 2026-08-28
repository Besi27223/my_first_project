"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  Expense,
  ExpenseCategory,
  MonthlyIncome,
  Profile,
  ReportChartRow,
  ReportSummary,
} from "@/lib/types/database";
import { computeReportChart, computeReportSummary } from "@/lib/reports-calc";
import {
  createDemoExpense,
  createDemoIncome,
  deleteDemoExpense,
  getActiveDemoUser,
  listDemoCategories,
  listDemoExpenses,
  listDemoIncome,
  updateDemoExpense,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/useCurrentProfile";

export interface NewExpenseInput {
  description: string;
  invoiceNumber: string;
  expenseDate: string;
  taxYear: number;
  amount: number;
  categoryId: string;
  notes: string;
  file: File | null;
}

export interface NewIncomeInput {
  grossAmount: number;
  netAmount: number;
  taxYear: number;
  month: number;
  files: File[];
}

async function authHeaders(): Promise<HeadersInit> {
  if (isDemoMode()) {
    return { "x-demo-user": getActiveDemoUser().id };
  }
  return {};
}

export async function listCategories(): Promise<ExpenseCategory[]> {
  if (isDemoMode()) return listDemoCategories();
  const supabase = createClient();
  const { data, error } = await supabase.from("expense_categories").select("*").order("sort_order");
  if (error) throw error;
  return data as ExpenseCategory[];
}

export async function listExpenses(): Promise<Expense[]> {
  if (isDemoMode()) return listDemoExpenses();
  const supabase = createClient();
  const { data, error } = await supabase.from("expenses").select("*").order("description");
  if (error) throw error;
  return data as Expense[];
}

export async function createExpense(input: NewExpenseInput): Promise<void> {
  if (isDemoMode()) {
    const categories = listDemoCategories();
    const category = categories.find((c) => c.id === input.categoryId);
    if (!category) throw new Error("קטגוריה לא נמצאה");
    const actor = getActiveDemoUser();
    const receiptUrl = input.file ? URL.createObjectURL(input.file) : "";
    createDemoExpense({
      created_by: actor.id,
      description: input.description,
      invoice_number: input.invoiceNumber || null,
      expense_date: input.expenseDate,
      tax_year: input.taxYear,
      amount: input.amount,
      category_id: input.categoryId,
      tax_pct_snapshot: category.tax_pct,
      notes: input.notes || null,
      receipt_paths: receiptUrl ? [receiptUrl] : [],
      archive_ref_id: null,
      dropbox_path: `(דמו — לא נשלח בפועל)/${input.taxYear}`,
    });
    return;
  }

  const formData = new FormData();
  formData.set("description", input.description);
  formData.set("invoiceNumber", input.invoiceNumber);
  formData.set("expenseDate", input.expenseDate);
  formData.set("taxYear", String(input.taxYear));
  formData.set("amount", String(input.amount));
  formData.set("categoryId", input.categoryId);
  formData.set("notes", input.notes);
  if (input.file) formData.set("file", input.file);

  const res = await fetch("/api/expenses", { method: "POST", body: formData, headers: await authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "שמירת ההוצאה נכשלה");
  }
}

export async function updateExpense(id: string, patch: Partial<Expense>, actor: Profile): Promise<void> {
  if (isDemoMode()) {
    updateDemoExpense(id, patch, actor);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("expenses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string, actor: Profile): Promise<void> {
  if (isDemoMode()) {
    deleteDemoExpense(id, actor);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function listIncome(): Promise<MonthlyIncome[]> {
  if (isDemoMode()) return listDemoIncome();
  const supabase = createClient();
  const { data, error } = await supabase.from("monthly_income").select("*").order("tax_year").order("month");
  if (error) throw error;
  return data as MonthlyIncome[];
}

export async function createIncome(input: NewIncomeInput): Promise<void> {
  if (isDemoMode()) {
    const actor = getActiveDemoUser();
    createDemoIncome({
      created_by: actor.id,
      gross_amount: input.grossAmount,
      net_amount: input.netAmount,
      tax_year: input.taxYear,
      month: input.month,
      reference_doc_paths: input.files.map((f) => URL.createObjectURL(f)),
      dropbox_path: null,
    });
    return;
  }

  const formData = new FormData();
  formData.set("grossAmount", String(input.grossAmount));
  formData.set("netAmount", String(input.netAmount));
  formData.set("taxYear", String(input.taxYear));
  formData.set("month", String(input.month));
  input.files.forEach((f) => formData.append("files", f));

  const res = await fetch("/api/income", { method: "POST", body: formData, headers: await authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "שמירת ההכנסה נכשלה");
  }
}

export async function getReportSummary(taxYear: number): Promise<ReportSummary> {
  if (isDemoMode()) {
    return computeReportSummary(listDemoExpenses(), listDemoIncome(), listDemoCategories(), taxYear);
  }
  const supabase = createClient();
  const { data, error } = await supabase.rpc("report_summary", { p_tax_year: taxYear });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as ReportSummary;
}

export async function getReportChart(taxYear: number): Promise<ReportChartRow[]> {
  if (isDemoMode()) {
    return computeReportChart(listDemoExpenses(), listDemoCategories(), taxYear);
  }
  const supabase = createClient();
  const { data, error } = await supabase.rpc("report_chart", { p_tax_year: taxYear });
  if (error) throw error;
  return data as ReportChartRow[];
}
