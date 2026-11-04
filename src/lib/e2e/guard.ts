/**
 * Test-only auth and storage switch.
 *
 * The harness turns on only when `E2E_TEST_AUTH=1` and `NODE_ENV` is
 * `development`, `test`, or `production` (`next start` reports production).
 * `NODE_ENV` alone never enables it.
 *
 * It stays off on every Vercel process (`VERCEL=1` or `VERCEL_ENV=production`),
 * even if the flag is set, and on the public production hostnames.
 * Middleware imports this file, so it must stay free of Node and Next APIs.
 *
 * Static `process.env.NAME` reads are paired with a dynamic read. A bundler
 * that inlines the static access on Vercel bakes in `VERCEL_ENV=production`
 * and the harness cannot be switched on later. A bundle built without those
 * variables still sees them at runtime through the dynamic read.
 */

export const E2E_TEST_USER_HEADER = "x-ats-e2e-user";
export const E2E_TEST_USER_COOKIE = "ats-e2e-user";

/** Fixed user. Callers cannot choose an id. */
export const E2E_TEST_USER_ID = "00000000-0000-4000-8000-0000000000e2";

const PRODUCTION_HOSTS = new Set([
  "after-the-sun.com",
  "www.after-the-sun.com",
  "after-the-sun.vercel.app",
]);

type EnvName = "E2E_TEST_AUTH" | "VERCEL_ENV" | "VERCEL" | "NODE_ENV";

function readEnv(name: EnvName): string | undefined {
  if (name === "E2E_TEST_AUTH") {
    return process.env.E2E_TEST_AUTH ?? process.env["E2E_TEST_AUTH"];
  }
  if (name === "VERCEL_ENV") {
    return process.env.VERCEL_ENV ?? process.env["VERCEL_ENV"];
  }
  if (name === "VERCEL") {
    return process.env.VERCEL ?? process.env["VERCEL"];
  }
  return process.env.NODE_ENV ?? process.env["NODE_ENV"];
}

export function hostnameFromHostHeader(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first) return null;
  if (first.startsWith("[")) {
    const end = first.indexOf("]");
    return end > 1 ? first.slice(1, end) : null;
  }
  const host = first.split(":")[0]?.replace(/\.+$/, "") ?? "";
  return host || null;
}

function isProductionHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  return PRODUCTION_HOSTS.has(hostname.toLowerCase().replace(/\.+$/, ""));
}

function isVercelRuntime(): boolean {
  if (readEnv("VERCEL_ENV") === "production") return true;
  return readEnv("VERCEL") === "1";
}

export function isE2ETestHarnessEnabled(hostname?: string | null): boolean {
  if (isVercelRuntime() || isProductionHostname(hostname)) return false;
  if (readEnv("E2E_TEST_AUTH") !== "1") return false;
  const nodeEnv = readEnv("NODE_ENV");
  return nodeEnv === "development" || nodeEnv === "test" || nodeEnv === "production";
}
