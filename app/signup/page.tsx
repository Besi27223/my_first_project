"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { completeHouseholdSetup, savePendingSignup, type PendingSignup } from "@/lib/pendingSignup";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "partner">("owner");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const pending: PendingSignup =
      role === "owner" ? { role, displayName } : { role, displayName, inviteCode: inviteCode.trim() };

    if (!signUpData.session) {
      // Email confirmation is required on this Supabase project — signUp()
      // doesn't log us in yet, so creating the household now would fail
      // (auth.uid() is null with no active session). Save the choices and
      // finish creating the household/profile on the first real login,
      // once the user has confirmed their email (see app/login/page.tsx).
      savePendingSignup(pending);
      setLoading(false);
      setPendingConfirmation(true);
      return;
    }

    const rpcError = await completeHouseholdSetup(supabase, pending);
    setLoading(false);
    if (rpcError) {
      setError(rpcError);
      return;
    }
    router.replace("/reports");
    router.refresh();
  }

  if (pendingConfirmation) {
    return (
      <main className="app-gradient-bg min-h-dvh flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm card-glass rounded-[var(--radius-card)] p-6 text-white text-center">
          <h1 className="font-[family-name:var(--font-heebo)] text-2xl font-extrabold mb-3">נשלח מייל אישור</h1>
          <p className="text-sm text-white/80 mb-6">
            שלחנו לכתובת {email} מייל אישור. אשר/י אותו, ואז חזור/י לכאן והתחבר/י — נשלים את ההרשמה אוטומטית בהתחברות הראשונה.
          </p>
          <Link href="/login" className="text-white font-bold underline">
            מעבר להתחברות
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-gradient-bg min-h-dvh flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm card-glass rounded-[var(--radius-card)] p-6 text-white">
        <h1 className="font-[family-name:var(--font-heebo)] text-2xl font-extrabold mb-1">הרשמה</h1>
        <p className="text-sm text-white/70 mb-6">
          הראשונ/ה שנרשמ/ת יוצר/ת את משק הבית כ&quot;בעלים&quot;. משתמש/ת שני/ה
          מצטרפ/ת כ&quot;שותף/ה&quot; עם קוד ההזמנה שהבעלים משתפ/ת (אפשר למצוא
          אותו במסך הדוחות לאחר ההרשמה).
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder="שם מלא"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-[var(--radius-button)] px-4 py-3 bg-white/90 text-ink placeholder:text-ink-3 outline-none"
          />
          <input
            type="email"
            required
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[var(--radius-button)] px-4 py-3 bg-white/90 text-ink placeholder:text-ink-3 outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[var(--radius-button)] px-4 py-3 bg-white/90 text-ink placeholder:text-ink-3 outline-none"
          />

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setRole("owner")}
              className={`flex-1 rounded-[var(--radius-button)] py-2 font-bold ${role === "owner" ? "bg-primary text-white" : "bg-white/20"}`}
            >
              בעלים (ראשונ/ה)
            </button>
            <button
              type="button"
              onClick={() => setRole("partner")}
              className={`flex-1 rounded-[var(--radius-button)] py-2 font-bold ${role === "partner" ? "bg-primary text-white" : "bg-white/20"}`}
            >
              שותף/ה
            </button>
          </div>

          {role === "partner" && (
            <input
              required
              placeholder="קוד הזמנה (מזהה משק הבית)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="rounded-[var(--radius-button)] px-4 py-3 bg-white/90 text-ink placeholder:text-ink-3 outline-none"
            />
          )}

          {error && <p className="text-coral-light text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-[var(--radius-button)] bg-primary py-3 font-bold disabled:opacity-60"
          >
            {loading ? "נרשמ/ת..." : "הרשמה"}
          </button>
        </form>

        <p className="text-sm text-white/70 mt-6 text-center">
          כבר יש חשבון?{" "}
          <Link href="/login" className="text-white font-bold underline">
            התחברות
          </Link>
        </p>
      </div>
    </main>
  );
}
