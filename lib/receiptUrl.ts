"use client";

import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/useCurrentProfile";

export async function getReceiptUrl(path: string): Promise<string> {
  if (isDemoMode() || path.startsWith("blob:") || path.startsWith("http")) {
    return path;
  }
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 300);
  if (error || !data) throw error ?? new Error("לא ניתן לפתוח את הקובץ");
  return data.signedUrl;
}
