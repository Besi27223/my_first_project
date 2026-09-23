"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Bounces any of the other 3 main screens back to the upload screen when
// this deployment is running in upload-only mode (NEXT_PUBLIC_UPLOAD_ONLY).
export default function UploadOnlyGuard() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_UPLOAD_ONLY === "true") {
      router.replace("/invoice/new");
    }
  }, [router]);

  return null;
}
