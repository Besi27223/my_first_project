import type { createClient } from "@/lib/supabase/client";

// When the Supabase project requires email confirmation, supabase.auth.signUp()
// doesn't return an active session — so the household/profile can't be created
// right away (auth.uid() would be null). We stash the signup choices here and
// finish the job on the user's first real login, once they're actually
// authenticated (see app/login/page.tsx).
export interface PendingSignup {
  role: "owner" | "partner";
  displayName: string;
  inviteCode?: string;
}

const KEY = "som:pending-signup";

export function savePendingSignup(data: PendingSignup) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing etc.) — signup completion
    // after email confirmation just won't be automatic in that case.
  }
}

export function readPendingSignup(): PendingSignup | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingSignup) : null;
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export async function completeHouseholdSetup(
  supabase: ReturnType<typeof createClient>,
  pending: PendingSignup,
): Promise<string | null> {
  if (pending.role === "owner") {
    const { error } = await supabase.rpc("create_household_and_owner", {
      p_display_name: pending.displayName,
    });
    if (error) return "יצירת משק הבית נכשלה: " + error.message;
  } else {
    const { error } = await supabase.rpc("join_household", {
      p_household_id: pending.inviteCode,
      p_display_name: pending.displayName,
    });
    if (error) return "ההצטרפות למשק הבית נכשלה: " + error.message;
  }
  clearPendingSignup();
  return null;
}
