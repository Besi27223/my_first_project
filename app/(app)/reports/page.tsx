"use client";

import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import AppHeader from "@/components/AppHeader";
import { createIncome, getReportChart, getReportSummary, listIncome } from "@/lib/data";
import { useCurrentProfile, isDemoMode } from "@/lib/useCurrentProfile";
import type { MonthlyIncome, ReportChartRow, ReportSummary } from "@/lib/types/database";

const TAX_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];
const fmt = (n: number) => Math.round(n).toLocaleString("he-IL");

export default function ReportsPage() {
  const { profile } = useCurrentProfile();
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [chart, setChart] = useState<ReportChartRow[]>([]);
  const [copied, setCopied] = useState(false);

  const [income, setIncome] = useState<MonthlyIncome[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [grossToSave, setGrossToSave] = useState("");
  const [netToSave, setNetToSave] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getReportSummary(taxYear).then(setSummary).catch(() => setSummary(null));
    getReportChart(taxYear).then(setChart).catch(() => setChart([]));
  }, [taxYear]);

  useEffect(() => {
    listIncome().then(setIncome).catch(() => {});
  }, [saveMsg]);

  const yearIncome = income.filter((i) => i.tax_year === taxYear);
  const netAnnual = yearIncome.reduce((s, i) => s + i.net_amount, 0);

  async function handleSaveIncome() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await createIncome({
        grossAmount: Number(grossToSave) || 0,
        netAmount: Number(netToSave) || 0,
        taxYear,
        month,
        files,
      });
      setFiles([]);
      setGrossToSave("");
      setNetToSave("");
      setSaveMsg("ההכנסה נשמרה בהצלחה");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "שמירת ההכנסה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader title="דוחות וסיכומים" subtitle="תמונת מצב שנתית" />

      <div className="px-[18px] flex flex-col gap-2.5 pb-32">
        <div className="flex items-center justify-between text-white">
          <span className="text-[13px] font-semibold text-white/85">שנת מס</span>
          <select
            value={taxYear}
            onChange={(e) => setTaxYear(Number(e.target.value))}
            className="rounded-[var(--radius-button)] bg-white/18 border border-white/20 px-3 py-1.5 text-sm"
          >
            {TAX_YEARS.map((y) => (
              <option key={y} value={y} className="text-ink">
                {y}
              </option>
            ))}
          </select>
        </div>

        <section
          className="rounded-[var(--radius-card)] p-3.5 text-white"
          style={{ background: "linear-gradient(162deg,#1796A8,#0C6E7F)" }}
        >
          <div className="text-[12.5px] text-white/80">לא חויב במס</div>
          <div className="num text-2xl font-extrabold mt-0.5">{fmt(summary?.not_taxed ?? 0)} ₪</div>
        </section>

        <div className="grid grid-cols-2 gap-2.5">
          <KpiCell label="זיכוי מס שנתי" value={summary?.annual_credit ?? 0} />
          <KpiCell label="החזר צפוי" value={summary?.expected_refund ?? 0} positive />
          <KpiCell label="סך הכנסות לשנת המס (ברוטו)" value={summary?.total_income ?? 0} />
          <KpiCell label="הכנסה נטו שנתית (מצטברת)" value={netAnnual} />
        </div>

        <section className="card-deep rounded-[var(--radius-card)] p-3.5 text-white">
          <h2 className="font-[family-name:var(--font-heebo)] font-bold text-[14px] mb-2">
            הוצאות מוכרות לפי קטגוריה
          </h2>
          <div style={{ width: "100%", height: 125 }}>
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis
                  dataKey="short_name"
                  tick={{ fill: "rgba(255,255,255,.7)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${fmt(Number(v))} ₪`, "מוכר"]}
                  contentStyle={{ background: "#241646", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, color: "#fff" }}
                />
                <Bar dataKey="recognized_amount" radius={[8, 8, 0, 0]}>
                  {chart.map((row) => (
                    <Cell key={row.category_id} fill={row.color_hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card-glass rounded-[var(--radius-card)] p-3.5 text-white">
          <h2 className="font-[family-name:var(--font-heebo)] font-bold text-[14px] mb-2">שמירת הכנסה חודשית</h2>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-white/85">
              חודש
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="form-input">
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-white/85">
              סכום ברוטו
              <input
                value={grossToSave}
                onChange={(e) => setGrossToSave(e.target.value)}
                placeholder="0.00"
                className="form-input num"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-white/85">
              סכום נטו
              <input
                value={netToSave}
                onChange={(e) => setNetToSave(e.target.value)}
                placeholder="0.00"
                className="form-input num"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-white/85 justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[var(--radius-button)] bg-white/90 text-ink font-semibold py-2.5 text-[12.5px]"
              >
                📎 אסמכתא {files.length > 0 && `· ${files.length}`}
              </button>
            </label>
          </div>
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
            className="w-full rounded-[var(--radius-button)] bg-primary text-white font-bold py-2.5 disabled:opacity-60"
          >
            {saving ? "שומר/ת..." : "שמור הכנסה חודשית"}
          </button>
          {saveMsg && <p className="text-[12.5px] mt-2 text-white/85">{saveMsg}</p>}
        </section>

        {!isDemoMode() && profile?.role === "owner" && (
          <details className="rounded-[var(--radius-card)] bg-white/10 border border-white/15 p-3 text-white">
            <summary className="text-[12.5px] font-semibold cursor-pointer">קוד הזמנה לשותף/ה</summary>
            <p className="text-[11.5px] text-white/70 mt-2 mb-2">שתפ/י קוד זה עם השותף/ה שלך כדי שיוכל/תוכל להצטרף למשק הבית בהרשמה.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[12px] bg-white/10 rounded-[var(--radius-button)] px-3 py-2 truncate">
                {profile.household_id}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profile.household_id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-[var(--radius-button)] bg-white/20 px-3 py-2 text-[12px] font-semibold"
              >
                {copied ? "הועתק!" : "העתקה"}
              </button>
            </div>
          </details>
        )}
      </div>
    </>
  );
}

function KpiCell({ label, value, positive, wide }: { label: string; value: number; positive?: boolean; wide?: boolean }) {
  return (
    <div className={`card-glass rounded-[var(--radius-card)] p-3 text-white ${wide ? "col-span-2" : ""}`}>
      <div className="text-[11.5px] text-white/72">{label}</div>
      <div className={`num text-lg font-extrabold mt-0.5 ${positive ? "text-green" : ""}`}>{fmt(value)} ₪</div>
    </div>
  );
}
