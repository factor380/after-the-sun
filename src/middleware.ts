import { NextResponse, type NextRequest } from "next/server";
import { routeRefreshesAuthSession } from "@/lib/supabase/session-routes";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Public pages stay free of Set-Cookie and an Auth round trip so ISR can be cached.
  if (!routeRefreshesAuthSession(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
