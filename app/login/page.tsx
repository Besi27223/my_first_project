"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("אימייל או סיסמה שגויים");
      return;
    }
    // Full navigation, not the client-side router — this can follow a
    // sign-in with an auth state the client Router Cache doesn't know
    // about yet, and we need the (app) layout's server-side check
    // (redirects to /onboarding if there's no household/profile yet) to
    // run fresh.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate hard navigation, see comment above
    window.location.href = "/reports";
  }

  return (
    <main className="app-gradient-bg min-h-dvh flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm card-glass rounded-[var(--radius-card)] p-6 text-white">
        <h1 className="font-[family-name:var(--font-heebo)] text-2xl font-extrabold mb-1">S.O.M</h1>
        <p className="text-sm text-white/70 mb-6">ניהול הוצאות והכנסות לעצמאים</p>

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
            {loading ? "מתחבר/ת..." : "התחברות"}
          </button>
        </form>

        <p className="text-sm text-white/70 mt-6 text-center">
          עדיין אין חשבון?{" "}
          <Link href="/signup" className="text-white font-bold underline">
            הרשמה
          </Link>
        </p>
      </div>
    </main>
  );
}
