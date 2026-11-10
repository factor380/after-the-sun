/** Comma-separated Google emails allowed to approve suggestions and edit spots. */
export function adminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes("@"));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return adminAllowlist().includes(normalized);
}

export type AdminPrincipal = { id: string; email?: string | null };

/**
 * Server-side write gate. The result never includes the allowlist or the
 * caller's email. Signed-out and signed-in non-admins both fail closed.
 */
export type AdminWriteDecision =
  | { ok: true; userId: string }
  | { ok: false; status: 403; reason: "signed-out" | "forbidden" };

export function adminWriteDecision(user: AdminPrincipal | null): AdminWriteDecision {
  if (!user?.id) return { ok: false, status: 403, reason: "signed-out" };
  if (!isAdminEmail(user.email)) {
    return { ok: false, status: 403, reason: "forbidden" };
  }
  return { ok: true, userId: user.id };
}

/**
 * What the browser is allowed to learn. Never includes the allowlist or an email.
 * `admin: false` is the only response for signed-out visitors and everyone else.
 */
export function adminAccessForEmail(
  email: string | null | undefined,
  pendingCount: number,
): { admin: false } | { admin: true; pendingCount: number } {
  if (!isAdminEmail(email)) return { admin: false };
  const count = Number.isFinite(pendingCount) ? Math.max(0, Math.floor(pendingCount)) : 0;
  return { admin: true, pendingCount: count };
}
