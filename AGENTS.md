<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Cloud Agents use a local PostgreSQL 16 database named `after_the_sun`. The `ubuntu` role connects with peer auth over the Postgres socket (`/var/run/postgresql`). On boot, the environment starts Postgres, syncs the Prisma schema, seeds spots, and runs the dev server at `http://localhost:3004`.

`.env` (gitignored) is created when missing:

- `DATABASE_URL` and `DIRECT_URL` point at that local database
- `NEXT_PUBLIC_SITE_URL=http://localhost:3004`

Map browsing, spot pages, lint, typecheck, Vitest, and `npm run build` work with that database. Google sign-in, photo upload, and place search stay disabled until `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optional `GEOAPIFY_API_KEY` are set. Do not point `DATABASE_URL` at a hosted Supabase database from this environment.

Canonical checks (also in the README): `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run dev`.
