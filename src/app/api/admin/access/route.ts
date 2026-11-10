import { NextResponse } from "next/server";
import { adminAccessForEmail, isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Whether the signed-in user may see the admin entry.
 * The allowlist stays on the server. Everyone else gets `{ admin: false }`.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json(adminAccessForEmail(user?.email, 0), {
        headers: NO_STORE,
      });
    }

    let pendingCount = 0;
    try {
      pendingCount = await prisma.spot.count({ where: { status: "pending" } });
    } catch (error) {
      console.error("GET /api/admin/access count", error);
    }

    return NextResponse.json(adminAccessForEmail(user.email, pendingCount), {
      headers: NO_STORE,
    });
  } catch (error) {
    console.error("GET /api/admin/access", error);
    return NextResponse.json({ admin: false }, { headers: NO_STORE });
  }
}
