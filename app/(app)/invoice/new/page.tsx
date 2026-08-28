"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/components/AppHeader";
import { categoryTagIcon } from "@/lib/icons";
import { createExpense, listCategories } from "@/lib/data";
import type { ExpenseCategory } from "@/lib/types/database";

const TAX_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

export default function NewInvoicePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [description, setDescription] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [taxYear, setTaxYear] = useState(2026);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setError("טעינת הקטגוריות נכשלה"));
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  function onFileChosen(f: File | null) {
    setFile(f);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  function validate(): string | null {
    if (!description.trim()) return "יש להזין שם ספק/מוצר";
    if (description.length > 100) return "שם ספק/מוצר ארוך מדי (עד 100 תווים)";
    if (!categoryId) return "יש לבחור קטגוריית הוצאה";
    const amt = Number(amount);
    if (!amount || !Number.isFinite(amt) || amt === 0) return "יש להזין סכום שונה מאפס";
    if (amt < -999999 || amt > 999999) return "הסכום מחוץ לטווח המותר";
    if (!file) return "יש לצרף תמונת קבלה או קובץ מצורף";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createExpense({
        description: description.trim(),
        invoiceNumber,
        expenseDate,
        taxYear,
        amount: Number(amount),
        categoryId,
        notes,
        file,
      });
      router.replace("/list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירת ההוצאה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader title="חשבונית חדשה" subtitle="תיעוד הוצאה עם קבלה" />

      <form onSubmit={handleSubmit} className="px-[18px] flex flex-col gap-3 pb-6">
        <Field label="שם ספק / מוצר *">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            required
            className="form-input"
            placeholder="לדוגמה: משרד קל בע״מ"
          />
        </Field>

        <Field label="מספר חשבונית">
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="form-input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="שנת מס *">
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="form-input"
            >
              {TAX_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>

          <Field label="תאריך *">
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              className="form-input"
            />
          </Field>
        </div>

        <Field label="סכום ההוצאה (₪) *">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="form-input num"
            placeholder="0.00"
          />
        </Field>

        <Field label="קטגוריית הוצאה *">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="form-input"
          >
            <option value="" disabled>
              בחר/י קטגוריה...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {selectedCategory && (
          <div className="flex items-center gap-2 rounded-[var(--radius-button)] px-3 py-2" style={{ background: "#E7E1F3" }}>
            <Image src={categoryTagIcon(selectedCategory.icon_key)} alt="" width={22} height={22} />
            <span className="text-sm text-ink font-semibold">
              אחוז הכרה: {Math.round(selectedCategory.tax_pct * 100)}%
            </span>
          </div>
        )}

        <Field label="תמונת קבלה או קובץ מצורף *">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 rounded-[var(--radius-button)] bg-white/90 text-ink font-semibold py-3"
            >
              📷 צילום קבלה
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-[var(--radius-button)] bg-white/90 text-ink font-semibold py-3"
            >
              📎 העלאת קובץ
            </button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
          />
          {file && (
            <div className="mt-2 flex items-center gap-3 rounded-[var(--radius-button)] bg-white/90 p-2">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="תצוגה מקדימה" className="w-14 h-14 object-cover rounded-lg" />
              ) : (
                <span className="text-2xl">📄</span>
              )}
              <span className="text-ink text-sm truncate flex-1">{file.name}</span>
            </div>
          )}
        </Field>

        <Field label="הערות">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="form-input resize-none"
            placeholder="הערות לרואה החשבון"
          />
        </Field>

        {error && <p className="text-coral-light text-sm font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-[var(--radius-button)] bg-primary text-white font-bold py-3.5 disabled:opacity-60"
        >
          {saving ? "שומר/ת..." : "שמירת הוצאה"}
        </button>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-white/85 text-[13px] font-semibold">{label}</span>
      {children}
    </label>
  );
}
