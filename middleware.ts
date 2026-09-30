import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - any file with an extension (images, etc.)
     */
    // Also skipped: the inbound webhook (it authenticates with its own key, not a
    // login session), and PWA assets browsers fetch without cookies.
    "/((?!_next/static|_next/image|favicon.ico|api/inbound|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
