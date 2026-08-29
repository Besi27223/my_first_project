"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { calculateSalary, DEFAULT_SALARY_INPUTS, type SalaryInputs } from "@/lib/salary";
import { createIncome, listIncome } from "@/lib/data";
import type { MonthlyIncome } from "@/lib/types/database";

const TAX_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export default function CalcPage() {
  const [inputs, setInputs] = useState<SalaryInputs>(DEFAULT_SALARY_INPUTS);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [income, setIncome] = useState<MonthlyIncome[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => calculateSalary(inputs), [inputs]);

  useEffect(() => {
    listIncome().then(setIncome).catch(() => {});
  }, [saveMsg]);

  const yearIncome = income.filter((i) => i.tax_year === taxYear);
  const grossAnnual = yearIncome.reduce((s, i) => s + i.gross_amount, 0);
  const netAnnual = yearIncome.reduce((s, i) => s + i.net_amount, 0);

  // Editable overrides for the save form; default to the calculator's
  // current output until the user types a value of their own.
  const [grossOverride, setGrossOverride] = useState<string | null>(null);
  const [netOverride, setNetOverride] = useState<string | null>(null);
  const grossToSave = grossOverride ?? result.grossMonthly.toFixed(2);
  const netToSave = netOverride ?? result.netMonthlyExpected.toFixed(2);

  function set<K extends keyof SalaryInputs>(key: K, value: string) {
    const num = Number(value);
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(num) ? num : 0 }));
  }

  async function handleSaveIncome() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await createIncome({
        grossAmount: Number(grossToSave),
        netAmount: Number(netToSave),
        taxYear,
        month,
        files,
      });
      setFiles([]);
      setGrossOverride(null);
      setNetOverride(null);
      setSaveMsg("ההכנסה נשמרה בהצלחה");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "שמירת ההכנסה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader title="מחשבון שכר" subtitle="שכר נטו חודשי משוער" />

      <div className="px-[18px] flex flex-col gap-4 pb-6">
        <section className="card-deep rounded-[var(--radius-card)] p-4 text-white">
          <h2 className="font-[family-name:var(--font-heebo)] font-bold text-[15px] mb-3">נתוני קלט</h2>
          <div className="grid grid-cols-2 gap-3">
            <CalcInput label="שכר לשעה (₪)" value={inputs.hourlyRate} onChange={(v) => set("hourlyRate", v)} />
            <CalcInput label="שעות לחודש" value={inputs.hoursPerMonth} onChange={(v) => set("hoursPerMonth", v)} />
            <CalcInput label="הכנסה נוספת (₪)" value={inputs.additionalIncome} onChange={(v) => set("additionalIncome", v)} />
            <CalcInput label="נקודות זיכוי" value={inputs.creditPoints} onChange={(v) => set("creditPoints", v)} step="0.25" />
          </div>
          <button
            type="button"
            onClick={() => setInputs(DEFAULT_SALARY_INPUTS)}
            className="mt-3 text-[12px] font-semibold text-white/70 underline"
          >
            איפוס לברירת מחדל
          </button>
        </section>

        <section className="card-deep rounded-[var(--radius-card)] p-4 text-white">
          <h2 className="font-[family-name:var(--font-heebo)] font-bold text-[15px] mb-3">ניכויים והכנסה נטו</h2>
          <Row k="ברוטו חודשי" v={result.grossMonthly} />
          <Row k="ביטוח לאומי" v={-result.bituachLeumi} />
          <Row k="מס הכנסה" v={-result.incomeTax} />
          <Row k="פנסיה עד תקרה" v={-result.pensionCeiling} />
          <Row k="קופת גמל להשקעה" v={-result.gemelInvestment} />
          <div className="h-px bg-white/15 my-2" />
          <Row k="הכנסה נטו צפויה — חודשי" v={result.netMonthlyExpected} bold />
          <div className="mt-3 rounded-[var(--radius-button)] bg-amber/15 border border-amber/30 px-3 py-2 flex items-start gap-2">
            <span>💡</span>
            <p className="text-[12.5px] text-white/85">
              קרן השתלמות: {fmt(result.kerenHishtalmutAnnualNote)} ₪/שנה — הערה בלבד, אינה נכללת בחישוב הנטו החודשי.
            </p>
          </div>
        </section>

        <div className="rounded-[var(--radius-button)] bg-white/10 border border-white/15 px-3 py-2 text-[12px] text-white/70">
          החזר המס בפועל תלוי בדוח השנתי שמגיש רואה החשבון שלך.
        </div>

        <section className="rounded-[var(--radius-card)] p-4" style={{ background: "linear-gradient(162deg,#1796A8,#0C6E7F)" }}>
          <div className="flex items-center justify-between text-white">
            <label className="text-[13px] font-semibold">שנת מס לצבירה</label>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="rounded-[var(--radius-button)] bg-white/20 text-white px-3 py-1.5 text-sm"
            >
              {TAX_YEARS.map((y) => (
                <option key={y} value={y} className="text-ink">
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-[var(--radius-button)] bg-white/15 p-3 text-white">
              <div className="text-[12px] text-white/70">ברוטו שנתי (מצטבר)</div>
              <div className="num text-xl font-extrabold mt-1">{fmt(grossAnnual)} ₪</div>
            </div>
            <div className="rounded-[var(--radius-button)] bg-white/15 p-3 text-white">
              <div className="text-[12px] text-white/70">נטו שנתי (מצטבר)</div>
              <div className="num text-xl font-extrabold mt-1">{fmt(netAnnual)} ₪</div>
            </div>
          </div>
        </section>

        <section className="card-glass rounded-[var(--radius-card)] p-4 text-white">
          <h2 className="font-[family-name:var(--font-heebo)] font-bold text-[15px] mb-3">שמירת הכנסה חודשית</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-white/85">
              חודש
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="form-input"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-white/85">
              שנת מס
              <select value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))} className="form-input">
                {TAX_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-white/85">
              סכום ברוטו
              <input value={grossToSave} onChange={(e) => setGrossOverride(e.target.value)} className="form-input num" />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-white/85">
              סכום נטו
              <input value={netToSave} onChange={(e) => setNetOverride(e.target.value)} className="form-input num" />
            </label>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-[var(--radius-button)] bg-white/90 text-ink font-semibold py-2.5 mb-3"
          >
            📎 צירוף אסמכתא (אופציונלי) {files.length > 0 && `· ${files.length} קבצים`}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />

          <button
            type="button"
            onClick={handleSaveIncome}
            disabled={saving}
            className="w-full rounded-[var(--radius-button)] bg-primary text-white font-bold py-3.5 disabled:opacity-60"
          >
            {saving ? "שומר/ת..." : "שמור הכנסה חודשית"}
          </button>
          {saveMsg && <p className="text-[13px] mt-2 text-white/85">{saveMsg}</p>}
        </section>
      </div>
    </>
  );
}

function CalcInput({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-white/85">
      {label}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input num"
      />
    </label>
  );
}

function Row({ k, v, bold }: { k: string; v: number; bold?: boolean }) {
  const negative = v < 0;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-[13.5px] ${bold ? "font-bold" : "text-white/80"}`}>{k}</span>
      <span className={`num ${bold ? "text-lg font-extrabold" : "text-sm font-semibold"} ${negative ? "text-coral-light" : ""}`}>
        {negative ? "-" : ""}
        {fmt(Math.abs(v))} ₪
      </span>
    </div>
  );
}
