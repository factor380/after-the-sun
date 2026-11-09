/** Comma-separated Google emails allowed to approve suggestions. */
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
