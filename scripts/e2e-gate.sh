#!/usr/bin/env bash
# Throwaway-database gate. Refuses any Supabase or non-local database URL.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${DATABASE_URL:-}" == *supabase.co* || "${DIRECT_URL:-}" == *supabase.co* ]]; then
  echo "e2e-gate: refusing a Supabase database URL" >&2
  exit 1
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@127.0.0.1:5432/after_the_sun?schema=public}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"
export E2E_TEST_AUTH=1
export E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:3004}"
# Fixed stand-ins. A real project URL or anon key from the shell is not used.
export NEXT_PUBLIC_SUPABASE_URL="https://e2e.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="e2e-anon-key"
export NEXT_PUBLIC_SITE_URL="http://localhost:3004"
unset GEOAPIFY_API_KEY SUPABASE_SERVICE_ROLE_KEY

node <<'NODE'
const raw = process.env.DATABASE_URL ?? "";
const direct = process.env.DIRECT_URL ?? "";
function hostOf(value, label) {
  try {
    return new URL(value.replace(/^postgres(?:ql)?:/i, "http:")).hostname;
  } catch {
    console.error(`e2e-gate: ${label} is not a valid database URL`);
    process.exit(1);
  }
}
for (const [label, value] of [["DATABASE_URL", raw], ["DIRECT_URL", direct]]) {
  const host = hostOf(value, label);
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!local || /supabase\.co|vercel\.app|after-the-sun\.com/i.test(value)) {
    console.error(`e2e-gate: ${label} must be a local Postgres URL`);
    process.exit(1);
  }
}
const baseHost = new URL(process.env.E2E_BASE_URL).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(baseHost)) {
  console.error("e2e-gate: E2E_BASE_URL must be local");
  process.exit(1);
}
NODE

npx prisma migrate deploy
npx tsx prisma/seed-e2e.ts
npm run build
npx playwright test
