"use client";

import type { Expense, ExpenseCategory, MonthlyIncome, Profile } from "@/lib/types/database";
import { DEMO_CATEGORIES, DEMO_EXPENSES, DEMO_INCOME, DEMO_OWNER, DEMO_PARTNER, DEMO_PROFILES } from "@/lib/demo/fixtures";

const EXPENSES_KEY = "som_demo_expenses";
const INCOME_KEY = "som_demo_income";
const ACTIVE_USER_KEY = "som_demo_active_user";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getActiveDemoUser(): Profile {
  const id = read<string | null>(ACTIVE_USER_KEY, null);
  return DEMO_PROFILES.find((p) => p.id === id) ?? DEMO_OWNER;
}

export function setActiveDemoUser(profile: Profile) {
  write(ACTIVE_USER_KEY, profile.id);
}

export function listDemoProfiles(): Profile[] {
  return DEMO_PROFILES;
}

export function listDemoCategories(): ExpenseCategory[] {
  return DEMO_CATEGORIES;
}

export function listDemoExpenses(): Expense[] {
  return read(EXPENSES_KEY, DEMO_EXPENSES);
}

export function canEdit(record: { created_by: string }, actor: Profile) {
  return actor.role === "owner" || record.created_by === actor.id;
}

export function createDemoExpense(input: Omit<Expense, "id" | "created_at" | "updated_at" | "household_id">) {
  const list = listDemoExpenses();
  const now = new Date().toISOString();
  const record: Expense = {
    ...input,
    id: crypto.randomUUID(),
    household_id: DEMO_OWNER.household_id,
    created_at: now,
    updated_at: now,
  };
  write(EXPENSES_KEY, [record, ...list]);
  return record;
}

export function updateDemoExpense(id: string, patch: Partial<Expense>, actor: Profile) {
  const list = listDemoExpenses();
  const existing = list.find((e) => e.id === id);
  if (!existing || !canEdit(existing, actor)) throw new Error("אין הרשאה לערוך רשומה זו");
  const updated = list.map((e) => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e));
  write(EXPENSES_KEY, updated);
}

export function deleteDemoExpense(id: string, actor: Profile) {
  const list = listDemoExpenses();
  const existing = list.find((e) => e.id === id);
  if (!existing || !canEdit(existing, actor)) throw new Error("אין הרשאה למחוק רשומה זו");
  write(EXPENSES_KEY, list.filter((e) => e.id !== id));
}

export function listDemoIncome(): MonthlyIncome[] {
  return read(INCOME_KEY, DEMO_INCOME);
}

export function createDemoIncome(input: Omit<MonthlyIncome, "id" | "created_at" | "updated_at" | "household_id">) {
  const list = listDemoIncome();
  const now = new Date().toISOString();
  const record: MonthlyIncome = {
    ...input,
    id: crypto.randomUUID(),
    household_id: DEMO_OWNER.household_id,
    created_at: now,
    updated_at: now,
  };
  write(INCOME_KEY, [record, ...list]);
  return record;
}

export function resetDemoData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EXPENSES_KEY);
  window.localStorage.removeItem(INCOME_KEY);
}

export { DEMO_OWNER, DEMO_PARTNER };
