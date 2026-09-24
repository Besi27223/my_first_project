"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Reached whenever there's an authenticated user with no profiles row yet —
// either right after signup (when email confirmation is disabled, so the
// session is already live), or after logging in post-email-confirmation.
// Either way, this is the first point where we're guaranteed to actually
// have a session, so the household/profile RPCs can run here directly.
export default function OnboardingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"owner" | "partner">("owner");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setCheckingAuth(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (role === "owner") {
      const { error: rpcError } = await supabase.rpc("create_household_and_owner", {
        p_display_name: displayName,
      });
      if (rpcError) {
        setLoading(false);
        setError("יצירת משק הבית נכשלה: " + rpcError.message);
        return;
      }
    } else {
      const { error: rpcError } = await supabase.rpc("join_household", {
        p_household_id: inviteCode.trim(),
        p_display_name: displayName,
      });
      if (rpcError) {
        setLoading(false);
        setError("ההצטרפות למשק הבית נכשלה: " + rpcError.message);
        return;
      }
    }

    setLoading(false);
    // A client-side router.replace() here can reuse a cached /reports
    // response from before the profile existed, bouncing straight back to
    // /onboarding. Force a real navigation so the (app) layout's
    // server-side profile check re-runs against the row we just created.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate hard navigation, see comment above
    window.location.href = "/reports";
  }

  if (checkingAuth) return null;

  return (
    <main className="app-gradient-bg min-h-dvh flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm card-glass rounded-[var(--radius-card)] p-6 text-white">
        <h1 className="font-[family-name:var(--font-heebo)] text-2xl font-extrabold mb-1">השלמת ההרשמה</h1>
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
            {loading ? "שומר/ת..." : "המשך"}
          </button>
        </form>
      </div>
    </main>
  );
}
