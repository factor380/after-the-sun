# After the Sun

Sunset spots sharing app for Israel — Beta (MVP).

## Stack (free-tier)

- **Next.js** (App Router) + TypeScript + Tailwind
- **Supabase** Free — Postgres, Auth (magic link), optional Storage later
- **Prisma** — ORM + migrations
- **Leaflet** + OpenStreetMap — maps (no Mapbox cost)
- **Vercel** Hobby — deploy when ready

## Setup

1. Create a free [Supabase](https://supabase.com) project.
2. Copy `.env.example` → `.env` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
   - `DATABASE_URL` (Transaction pooler, port **6543**, with `?pgbouncer=true`)
   - `DIRECT_URL` (Session / direct, port **5432**)
3. In Supabase Auth → URL configuration, add redirect:
   - `http://localhost:3000/auth/callback`
4. Install and push schema:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local server |
| `npm run db:push` | Sync Prisma schema to Supabase |
| `npm run db:seed` | Seed ~10 Israel sunset spots |
| `npm run db:studio` | Prisma Studio |

## Product (Beta)

- Map of spots centered on Israel
- Spot detail pages
- Magic-link sign-in
- Authenticated users can add a spot (map pin + form)

AI recommendations are intentionally **not** in Beta; a future `src/ai/` layer can call the same `services/spots` API.
