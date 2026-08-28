"use client";

import { useRouter } from "next/navigation";
import { useCurrentProfile, isDemoMode } from "@/lib/useCurrentProfile";
import { DEMO_OWNER, DEMO_PARTNER } from "@/lib/demo/fixtures";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const { profile, switchDemoUser } = useCurrentProfile();
  const demo = isDemoMode();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="px-[18px] pt-[calc(18px+env(safe-area-inset-top))] pb-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heebo)] text-[22px] font-800">{title}</h1>
          {subtitle && <p className="text-white/60 text-[13px] mt-0.5">{subtitle}</p>}
        </div>

        {demo ? (
          <div className="flex rounded-[var(--radius-pill)] bg-white/18 p-1 text-[12px] font-semibold">
            <button
              onClick={() => switchDemoUser(DEMO_OWNER)}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] ${profile?.id === DEMO_OWNER.id ? "bg-white text-ink" : "text-white/80"}`}
            >
              בעלים
            </button>
            <button
              onClick={() => switchDemoUser(DEMO_PARTNER)}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] ${profile?.id === DEMO_PARTNER.id ? "bg-white text-ink" : "text-white/80"}`}
            >
              שותף/ה
            </button>
          </div>
        ) : (
          profile && (
            <button
              onClick={handleLogout}
              className="text-[12px] font-semibold rounded-[var(--radius-pill)] bg-white/18 border border-white/24 px-3 py-1.5"
            >
              {profile.display_name} · יציאה
            </button>
          )
        )}
      </div>
    </header>
  );
}
