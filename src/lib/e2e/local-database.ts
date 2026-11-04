/**
 * E2E refuses any database that is not local Postgres.
 * The error never includes the connection string (it may carry a password).
 */
export function assertLocalDatabase(connectionString: string | undefined, label: string): void {
  if (!connectionString) {
    throw new Error(`${label} is not set`);
  }

  let hostname = "";
  try {
    hostname = new URL(connectionString.replace(/^postgres(?:ql)?:/i, "http:")).hostname;
  } catch {
    throw new Error(`${label} is not a valid database URL`);
  }

  const local =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (!local || /supabase\.co|vercel\.app|after-the-sun\.com/i.test(connectionString)) {
    throw new Error(`${label} must be a local Postgres URL (host: ${hostname || "unknown"})`);
  }
}
