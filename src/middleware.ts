import { NextResponse, type NextRequest } from "next/server";
import { isE2ETestHarnessEnabled } from "@/lib/e2e/guard";
import { routeRefreshesAuthSession } from "@/lib/supabase/session-routes";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Public pages stay free of Set-Cookie and an Auth round trip so ISR can be cached.
  if (!routeRefreshesAuthSession(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  // The harness replaces Supabase. Do not call Auth on the stub host.
  if (isE2ETestHarnessEnabled(request.nextUrl.hostname)) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
