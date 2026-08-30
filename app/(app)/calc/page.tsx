"use client";

import { useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { calculateSalary, DEFAULT_SALARY_INPUTS, type SalaryInputs } from "@/lib/salary";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

// Raw text per field, so the input can sit empty or mid-edit without the
// component fighting the user by forcing a parsed "0" back in on every
// keystroke (that's what caused values like "1920"/"0192" when replacing
// the default). Only coerced to a number where actually calculated.
type RawSalaryInputs = Record<keyof SalaryInputs, string>;

const DEFAULT_RAW_INPUTS: RawSalaryInputs = {
  hourlyRate: String(DEFAULT_SALARY_INPUTS.hourlyRate),
  hoursPerMonth: String(DEFAULT_SALARY_INPUTS.hoursPerMonth),
  additionalIncome: String(DEFAULT_SALARY_INPUTS.additionalIncome),
  creditPoints: String(DEFAULT_SALARY_INPUTS.creditPoints),
};

export default function CalcPage() {
  const [rawInputs, setRawInputs] = useState<RawSalaryInputs>(DEFAULT_RAW_INPUTS);

  const inputs: SalaryInputs = useMemo(
    () => ({
      hourlyRate: Number(rawInputs.hourlyRate) || 0,
      hoursPerMonth: Number(rawInputs.hoursPerMonth) || 0,
      additionalIncome: Number(rawInputs.additionalIncome) || 0,
      creditPoints: Number(rawInputs.creditPoints) || 0,
    }),
    [rawInputs],
  );
  const result = useMemo(() => calculateSalary(inputs), [inputs]);

  function set(key: keyof SalaryInputs, value: string) {
    setRawInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <AppHeader title="מחשבון שכר" subtitle="שכר נטו חודשי משוער" />

      <div className="px-[18px] flex flex-col gap-3 pb-32">
        <section className="card-deep rounded-[var(--radius-card)] p-4 text-white">
          <h2 className="font-[family-name:var(--font-heebo)] font-bold text-[15px] mb-3">נתוני קלט</h2>
          <div className="grid grid-cols-2 gap-3">
            <CalcInput label="שכר לשעה (₪)" value={rawInputs.hourlyRate} onChange={(v) => set("hourlyRate", v)} />
            <CalcInput label="שעות לחודש" value={rawInputs.hoursPerMonth} onChange={(v) => set("hoursPerMonth", v)} />
            <CalcInput label="הכנסה נוספת (₪)" value={rawInputs.additionalIncome} onChange={(v) => set("additionalIncome", v)} />
            <CalcInput label="נקודות זיכוי" value={rawInputs.creditPoints} onChange={(v) => set("creditPoints", v)} step="0.25" />
          </div>
          <button
            type="button"
            onClick={() => setRawInputs(DEFAULT_RAW_INPUTS)}
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

        <div className="rounded-[var(--radius-button)] bg-white/10 border border-white/15 px-3 py-2 text-[12px] text-white/70">
          לצבירת הכנסה שנתית ולשמירת הכנסה חודשית — עברו למסך הדוחות.
        </div>
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
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-white/85">
      {label}
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-input num pe-8"
        />
        {value !== "" && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="ניקוי שדה"
            className="absolute inset-y-0 end-2 flex items-center text-ink-3"
          >
            ✕
          </button>
        )}
      </div>
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
