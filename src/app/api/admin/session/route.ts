import { NextResponse } from "next/server";
import { adminWriteDecision } from "@/lib/admin";
import { readAdminRequest } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

/**
 * Whether the signed-in Google user is an admin.
 * The body is only `{ admin: boolean }` — the allowlist stays on the server.
 */
export async function GET() {
  const { user } = await readAdminRequest();
  const decision = adminWriteDecision(user);
  return NextResponse.json(
    { admin: decision.ok },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
