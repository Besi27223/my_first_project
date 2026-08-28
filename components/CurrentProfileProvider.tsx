"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Profile } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { DEMO_OWNER, getActiveDemoUser, setActiveDemoUser } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/useCurrentProfile";

interface CurrentProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  switchDemoUser: (next: Profile) => void;
}

const CurrentProfileContext = createContext<CurrentProfileContextValue | null>(null);

/** Single source of truth for "who's using the app right now", shared by
 * every component (header, list, reports...) so switching the active demo
 * user in the header is instantly reflected everywhere else. */
export function CurrentProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(isDemoMode() ? DEMO_OWNER : null);
  const [loading, setLoading] = useState(!isDemoMode());

  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      setProfile(getActiveDemoUser());
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    refresh();
  }, [refresh]);

  const switchDemoUser = useCallback((next: Profile) => {
    setActiveDemoUser(next);
    setProfile(next);
  }, []);

  return (
    <CurrentProfileContext.Provider value={{ profile, loading, refresh, switchDemoUser }}>
      {children}
    </CurrentProfileContext.Provider>
  );
}

export function useCurrentProfileContext() {
  const ctx = useContext(CurrentProfileContext);
  if (!ctx) throw new Error("useCurrentProfileContext must be used within CurrentProfileProvider");
  return ctx;
}
