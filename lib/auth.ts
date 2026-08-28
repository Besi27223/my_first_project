import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";
import { DEMO_OWNER } from "@/lib/demo/fixtures";

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Server-side current profile. In demo mode there is no real session, so
 * requests are attributed to the demo owner by default — screens that need
 * to honor the active *demo* user (switched client-side) read it from the
 * `x-demo-user` header the client data layer attaches to API calls. */
export async function getCurrentProfile(request?: Request): Promise<Profile> {
  if (isDemo) {
    const demoUserId = request?.headers.get("x-demo-user");
    if (demoUserId) {
      const { DEMO_PARTNER } = await import("@/lib/demo/fixtures");
      return demoUserId === DEMO_PARTNER.id ? DEMO_PARTNER : DEMO_OWNER;
    }
    return DEMO_OWNER;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("לא מחובר/ת");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) throw new Error("לא נמצא פרופיל משתמש");

  return profile as Profile;
}
