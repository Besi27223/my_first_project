import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/manifest.webmanifest"];

// Next.js 16's replacement for middleware.ts. Deliberately kept on this
// convention (not middleware.ts): Proxy defaults to the Node.js runtime,
// while middleware.ts still defaults to the Edge Runtime — and
// @supabase/ssr's createServerClient pulls in @supabase/realtime-js's
// WebSocket dependency chain at *import time*, unconditionally, which
// references Node-only globals (__dirname) the Edge Runtime doesn't have.
// See https://github.com/supabase/supabase/issues/21009.
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabaseUrl || !supabaseAnonKey) {
    // Demo mode runs without a Supabase project at all — never touch it.
    // Also fail open (rather than crash) when real mode is misconfigured:
    // a deploy that lands before Supabase env vars are set should still
    // serve pages instead of a 500 on every single route.
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|sw.js|manifest.webmanifest).*)"],
};
