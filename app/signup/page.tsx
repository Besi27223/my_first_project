"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!signUpData.session) {
      // Email confirmation is required on this Supabase project — signUp()
      // doesn't log us in yet. Household/profile setup happens on
      // /onboarding once there's an actual session (right after login,
      // the (app) layout redirects any authenticated-but-profile-less
      // user there automatically).
      setPendingConfirmation(true);
      return;
    }

    router.replace("/onboarding");
  }

  if (pendingConfirmation) {
    return (
      <main className="app-gradient-bg min-h-dvh flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm card-glass rounded-[var(--radius-card)] p-6 text-white text-center">
          <h1 className="font-[family-name:var(--font-heebo)] text-2xl font-extrabold mb-3">נשלח מייל אישור</h1>
          <p className="text-sm text-white/80 mb-6">
            שלחנו לכתובת {email} מייל אישור. אשר/י אותו, ואז חזור/י לכאן והתחבר/י כדי להשלים את ההרשמה.
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
          לאחר יצירת החשבון תוכל/י לבחור אם את/ה &quot;בעלים&quot; (ראשונ/ה, יוצר/ת
          את משק הבית) או &quot;שותף/ה&quot; (מצטרפ/ת עם קוד הזמנה).
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
