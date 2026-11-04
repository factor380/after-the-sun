# Testing

GitHub Actions runs two jobs on every push and pull request. Both have to pass before a merge.

1. **Lint, typecheck, and build** — `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm test`, and `npm run build`. This job does not connect to a database.
2. **Integration and e2e** — Postgres 16 in the workflow, `prisma migrate deploy`, a small seed (one spot in each region), `npm run build`, then Playwright against that local server.

The e2e job does not use production secrets. `scripts/e2e-gate.sh` refuses a database host other than localhost, and it forces the Supabase URL to `https://e2e.supabase.co`. Google sign-in is not called. Photo uploads are written under the system temp directory.

`E2E_TEST_AUTH=1` enables a fixed test user (`x-ats-e2e-user: 1`). The same process also has to be outside Vercel (`VERCEL` and `VERCEL_ENV=production` both turn the harness off), and the request host cannot be `after-the-sun.com` or `after-the-sun.vercel.app`. `NODE_ENV` by itself never turns it on.

## Run the gate locally

Start a throwaway Postgres (Docker or a local cluster) with database `after_the_sun`, user `ci`, password `ci`, on port 5432. Stop anything else on port 3004.

```bash
npx playwright install chromium
npm run test:e2e
```

Override the URL when Postgres is not on the default port:

```bash
DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/after_the_sun?schema=public \
DIRECT_URL=postgresql://ci:ci@127.0.0.1:5432/after_the_sun?schema=public \
E2E_BASE_URL=http://localhost:3004 \
npm run test:e2e
```

Do not point `DATABASE_URL` at Supabase. The script exits if you do.

`npm test` still runs the unit tests with no database.

## Production database

The Prisma migration in `prisma/migrations` is for an empty database. The live Supabase project was created with `db push` and `supabase/migrations`, and it does not have this migration history. Do not run `prisma migrate deploy` against that project without a baseline plan.
