# After the Sun

Sunset spots sharing app for Israel - Beta (MVP).

## Stack (free-tier)

- **Next.js** (App Router) + TypeScript + Tailwind
- **Supabase** Free - Postgres, Auth (Google sign-in), Storage (spot photos)
- **Prisma** - ORM + migrations
- **Leaflet** + OpenStreetMap - maps (no Mapbox cost)
- **Vercel** Hobby - deploy when ready

## Setup

1. Create a free [Supabase](https://supabase.com) project.
2. Copy `.env.example` → `.env` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
   - `DATABASE_URL` (Transaction pooler, port **6543**, with `?pgbouncer=true`)
   - `DIRECT_URL` (Session / direct, port **5432**)
3. In Supabase Auth → URL Configuration:
   - **Site URL** = production (e.g. `https://after-the-sun.vercel.app`)
   - **Redirect URLs** must include both production *and* local, or Google login from localhost will bounce to the live site:
     - `http://localhost:3004/auth/callback`
     - `http://localhost:3004/**`
     - `https://your-domain/auth/callback`
4. Enable **Google** sign-in:
   - Supabase Dashboard → Authentication → Providers → Google → Enable
   - In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (Web application)
   - Authorized redirect URI: copy from Supabase (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`)
   - Paste the Client ID and Client Secret into Supabase
5. Create a **public** Storage bucket named `spot-photos` (Dashboard → Storage → New bucket). Then in SQL Editor:

```sql
-- Authenticated users upload only into their own folder
create policy "spot photos insert own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'spot-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can read public spot photos
create policy "spot photos public read"
on storage.objects for select to public
using (bucket_id = 'spot-photos');

-- Contributors can remove their own uploads (storage cleanup when a photo is deleted)
create policy "spot photos delete own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'spot-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

6. Install and push schema:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3004](http://localhost:3004).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local server |
| `npm run db:push` | Sync Prisma schema to Supabase |
| `npm run db:seed` | Seed ~10 Israel sunset spots |
| `npm run db:studio` | Prisma Studio |

## Product (Beta)

- Map of spots centered on Israel, with photo previews in the marker popups and the spot list
- Spot detail pages with a photo gallery and full-screen lightbox
- Google sign-in
- Authenticated users can add a spot (map pin + form + optional sunset photo upload)
- Authenticated users can contribute photos to **any** existing spot; the uploader or the
  spot owner can remove them. Capped at 24 photos per spot and 5 per user per spot.

AI recommendations are intentionally **not** in Beta; a future `src/ai/` layer can call the same `services/spots` API.
