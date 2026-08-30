"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import AppHeader from "@/components/AppHeader";
import { categoryListIcon, categoryTagIcon } from "@/lib/icons";
import { deleteExpense, listCategories, listExpenses, updateExpense } from "@/lib/data";
import { getReceiptUrl } from "@/lib/receiptUrl";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { canEdit } from "@/lib/demo/store";
import type { Expense, ExpenseCategory } from "@/lib/types/database";

const TAX_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const fmt = (n: number) => n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ListPage() {
  const { profile } = useCurrentProfile();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [query, setQuery] = useState("");
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    setLoading(true);
    Promise.all([listExpenses(), listCategories()])
      .then(([e, c]) => {
        setExpenses(e);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => e.tax_year === taxYear)
      .filter((e) => !categoryId || e.category_id === categoryId)
      .filter((e) => !query.trim() || e.description.includes(query.trim()))
      .sort((a, b) => a.description.localeCompare(b.description, "he"));
  }, [expenses, taxYear, categoryId, query]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AppHeader title="חשבוניות שנסרקו" subtitle={`${filtered.length} רשומות`} />

      <div className="px-[18px] flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש חופשי לפי שם..."
            className="flex-1 rounded-[var(--radius-button)] bg-white/18 border border-white/20 text-white placeholder:text-white/60 px-4 py-2.5 outline-none"
          />
          <select
            value={taxYear}
            onChange={(e) => setTaxYear(Number(e.target.value))}
            className="rounded-[var(--radius-button)] bg-white/18 border border-white/20 text-white px-3 py-2.5 text-sm"
          >
            {TAX_YEARS.map((y) => (
              <option key={y} value={y} className="text-ink">
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-[18px] px-[18px]">
          <button
            onClick={() => setCategoryId(null)}
            className={`shrink-0 rounded-[var(--radius-pill)] px-3.5 py-2 text-[12.5px] font-semibold ${!categoryId ? "bg-white text-ink" : "bg-white/18 text-white"}`}
          >
            הצג הכל
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-2 text-[12.5px] font-semibold ${categoryId === c.id ? "bg-white text-ink" : "bg-white/18 text-white"}`}
            >
              <Image src={categoryListIcon(c.icon_key)} alt="" width={16} height={16} />
              {c.short_name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 bg-surface rounded-t-[24px] flex-1 min-h-0 overflow-y-auto pb-20">
        {loading ? (
          <p className="text-center text-ink-3 py-10 text-sm">טוען...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-ink-3 py-10 text-sm">לא נמצאו רשומות</p>
        ) : (
          filtered.map((e) => {
            const category = categoryById.get(e.category_id);
            return (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className="w-full flex items-center gap-3 px-[18px] py-3 border-b border-line text-right"
              >
                <span
                  className="w-11 h-11 rounded-[var(--radius-tile)] flex items-center justify-center shrink-0"
                  style={{ background: category ? `${category.color_hex}24` : "#eee" }}
                >
                  {category && <Image src={categoryListIcon(category.icon_key)} alt="" width={22} height={22} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-ink font-semibold text-[14.5px] truncate">{e.description}</span>
                  <span className="block text-ink-3 text-[12px]">{e.expense_date}</span>
                </span>
                <span className="num text-ink font-bold text-[14.5px]">{fmt(e.amount)} ₪</span>
              </button>
            );
          })
        )}
      </div>

      {selected && (
        <ExpenseDetail
          expense={selected}
          category={categoryById.get(selected.category_id)}
          canManage={!!profile && canEdit(selected, profile)}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function ExpenseDetail({
  expense,
  category,
  canManage,
  onClose,
  onChanged,
}: {
  expense: Expense;
  category: ExpenseCategory | undefined;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { profile } = useCurrentProfile();
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const path = expense.receipt_paths[0];
    if (path) getReceiptUrl(path).then(setReceiptUrl).catch(() => setReceiptUrl(null));
  }, [expense.receipt_paths]);

  async function handleSave() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      await updateExpense(expense.id, { description, amount: Number(amount), notes: notes || null }, profile);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "העדכון נכשל");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!profile) return;
    if (!confirm("למחוק את הרשומה? הפעולה בלתי הפיכה.")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteExpense(expense.id, profile);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "המחיקה נכשלה");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface rounded-[var(--radius-card)] p-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptUrl} alt="קבלה" className="w-full h-40 object-cover rounded-[var(--radius-button)] mb-3" />
          </a>
        )}

        {editing ? (
          <div className="flex flex-col gap-2">
            <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} className="form-input" />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" className="form-input num" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="form-input resize-none" />
          </div>
        ) : (
          <>
            <h3 className="text-ink font-bold text-lg">{expense.description}</h3>
            <p className="num text-ink text-2xl font-extrabold mt-1">{fmt(expense.amount)} ₪</p>
            <p className="text-ink-3 text-sm mt-1">{expense.expense_date}</p>
            {expense.notes && <p className="text-ink-2 text-sm mt-2">{expense.notes}</p>}
          </>
        )}

        {category && (
          <div className="flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 mt-3 w-fit" style={{ background: `${category.color_hex}1A` }}>
            <Image src={categoryTagIcon(category.icon_key)} alt="" width={18} height={18} />
            <span className="text-sm font-semibold" style={{ color: category.color_hex }}>
              {category.name}
            </span>
          </div>
        )}

        {error && <p className="text-coral-700 text-sm mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          {canManage && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="flex-1 rounded-[var(--radius-button)] bg-primary-tint text-primary-700 font-semibold py-2.5">
                עריכה
              </button>
              <button onClick={handleDelete} disabled={busy} className="flex-1 rounded-[var(--radius-button)] bg-coral/10 text-coral-700 font-semibold py-2.5">
                מחיקה
              </button>
            </>
          )}
          {canManage && editing && (
            <button onClick={handleSave} disabled={busy} className="flex-1 rounded-[var(--radius-button)] bg-primary text-white font-semibold py-2.5">
              {busy ? "שומר/ת..." : "שמירה"}
            </button>
          )}
          <button onClick={onClose} className="flex-1 rounded-[var(--radius-button)] bg-line text-ink font-semibold py-2.5">
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}
