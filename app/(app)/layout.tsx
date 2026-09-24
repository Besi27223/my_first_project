import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { CurrentProfileProvider } from "@/components/CurrentProfileProvider";
import { createClient } from "@/lib/supabase/server";

// Auth gate for the 4 main screens, done here (a Server Component, plain
// Node.js runtime) instead of Proxy/Middleware — @supabase/ssr pulls in
// @supabase/realtime-js's Node-only dependency chain at import time, which
// Vercel's Edge Runtime can't run, and Next.js 16's Node.js-runtime Proxy
// convention isn't reliably deployable on Vercel yet either.
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isDemo && supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    // Authenticated but no household/profile yet — either mid-signup (email
    // confirmation pending), or a household-creation step that never
    // completed (e.g. it failed before the user had a session at all).
    // Send them to finish that instead of leaving the app broken/empty.
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!profile) {
      redirect("/onboarding");
    }
  }

  const uploadOnly = process.env.NEXT_PUBLIC_UPLOAD_ONLY === "true";

  return (
    <CurrentProfileProvider>
      <div className="min-h-dvh flex flex-col">
        <div className="app-gradient-bg flex-1 flex flex-col">
          <div className="flex-1 flex flex-col">{children}</div>
        </div>
        {!uploadOnly && <BottomNav />}
      </div>
    </CurrentProfileProvider>
  );
}
