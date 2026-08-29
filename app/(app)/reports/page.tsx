"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import AppHeader from "@/components/AppHeader";
import { getReportChart, getReportSummary } from "@/lib/data";
import { useCurrentProfile, isDemoMode } from "@/lib/useCurrentProfile";
import type { ReportChartRow, ReportSummary } from "@/lib/types/database";

const TAX_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const fmt = (n: number) => Math.round(n).toLocaleString("he-IL");

export default function ReportsPage() {
  const { profile } = useCurrentProfile();
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [chart, setChart] = useState<ReportChartRow[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getReportSummary(taxYear).then(setSummary).catch(() => setSummary(null));
    getReportChart(taxYear).then(setChart).catch(() => setChart([]));
  }, [taxYear]);

  return (
    <>
      <AppHeader title="דוחות וסיכומים" subtitle="תמונת מצב שנתית" />

      <div className="px-[18px] flex flex-col gap-4 pb-6">
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
          className="rounded-[var(--radius-card)] p-4 text-white"
          style={{ background: "linear-gradient(162deg,#1796A8,#0C6E7F)" }}
        >
          <div className="text-[13px] text-white/80">לא חויב במס</div>
          <div className="num text-3xl font-extrabold mt-1">{fmt(summary?.not_taxed ?? 0)} ₪</div>
          <div className="text-[12px] text-white/70 mt-1">סכום ההוצאות המוכרות שהפחיתו את הרווח החייב במס</div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <KpiCell label="זיכוי מס שנתי" value={summary?.annual_credit ?? 0} />
          <KpiCell label="החזר צפוי" value={summary?.expected_refund ?? 0} positive />
          <KpiCell label="סך הכנסות לשנת המס" value={summary?.total_income ?? 0} wide />
        </div>

        <section className="card-deep rounded-[var(--radius-card)] p-4 text-white">
          <h2 className="font-[family-name:var(--font-heebo)] font-bold text-[15px] mb-3">
            הוצאות מוכרות לפי קטגוריה
          </h2>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis
                  dataKey="short_name"
                  tick={{ fill: "rgba(255,255,255,.7)", fontSize: 12 }}
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

        {!isDemoMode() && profile?.role === "owner" && (
          <section className="rounded-[var(--radius-card)] bg-white/10 border border-white/15 p-4 text-white">
            <h2 className="text-[13px] font-semibold mb-1">קוד הזמנה לשותף/ה</h2>
            <p className="text-[12px] text-white/70 mb-2">שתפ/י קוד זה עם השותף/ה שלך כדי שיוכל/תוכל להצטרף למשק הבית בהרשמה.</p>
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
          </section>
        )}
      </div>
    </>
  );
}

function KpiCell({ label, value, positive, wide }: { label: string; value: number; positive?: boolean; wide?: boolean }) {
  return (
    <div className={`card-glass rounded-[var(--radius-card)] p-3.5 text-white ${wide ? "col-span-2" : ""}`}>
      <div className="text-[12px] text-white/72">{label}</div>
      <div className={`num text-xl font-extrabold mt-1 ${positive ? "text-green" : ""}`}>{fmt(value)} ₪</div>
    </div>
  );
}
