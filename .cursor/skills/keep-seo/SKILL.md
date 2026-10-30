---
name: keep-seo
description: >-
  Keeps After the Sun crawlable and correctly tagged for Google. Use when adding
  or editing pages, routes, metadata, sitemap, robots, maps, spot lists, Open
  Graph, JSON-LD, or when the user mentions SEO, Google, indexing, or Search
  Console.
---

# Keep After the Sun SEO-safe

Public pages must be crawlable with unique metadata. Private pages must stay out of the index. Reuse `src/lib/seo.ts` instead of hardcoding URLs or titles.

## Before finishing a change

If the work touches routing, rendered text, photos, or metadata, check:

1. Public page? Unique `title` + `description` + `alternates.canonical` (path, not homepage).
2. Private page (`/login`, `/spots/new`, `/spots/mine`, `/spots/[id]/edit`, `/auth/*`, `/api/*`)? `robots: noIndexRobots`.
3. New **public** URL? Add it to `src/app/sitemap.ts`. Keep it allowed in `src/app/robots.ts`.
4. Map / virtualized lists still have a **server-rendered** link list (see `HomeSpotIndex`).
5. Spot pages still emit JSON-LD via `spotJsonLd` and an `h1` with the spot name.

## Hard rules

- **Never** set `alternates.canonical` on the root layout to the homepage. That canonicalizes every child route to `/`.
- **Never** put localhost in canonical / OG / sitemap. Use `getSiteUrl()` / `absoluteUrl()`.
- **Never** fetch `/api/spots` to build the sitemap. Call `listSpots()` and swallow DB errors (home-only fallback).
- JSON-LD goes through `JsonLd` (`jsonLdString` escapes `<`). Do not dump unsanitized HTML.
- Root `<html>` stays `lang="he"` `dir="rtl"`.
- Public copy is Hebrew. Titles use the layout template (`%s | After the Sun`); do not append the brand twice.
- OG images: default `src/app/opengraph-image.tsx` (`/opengraph-image`, 1200×630). Spot pages use the cover photo when it is a public https URL; otherwise they use that same default image. Do not generate a per-spot card. `twitter:card` stays `summary_large_image`, and `spotJsonLd` uses the same image URL.

## Page types

| Route | Index? | Required |
|---|---|---|
| `/` | yes | canonical `/`, `websiteJsonLd` + `spotsItemListJsonLd`, crawlable spot links, `h1` |
| `/about` | yes | unique title + description, canonical `/about`, `h1`, `aboutPageJsonLd`. `/50` 308s here and stays out of the sitemap |
| `/regions/[slug]` | yes | unique title + description from `SUNSET_REGIONS`, canonical `/regions/{slug}`, `h1`, visible spot links, `regionPageJsonLd` (ItemList + BreadcrumbList). Unknown slugs 404 |
| `/guides/jerusalem-sunset` | yes | unique title + description, canonical `/guides/jerusalem-sunset`, `h1`, `guideArticleJsonLd` (Article image is the Gan HaKipod share card, plus FAQPage + Place ItemList). ISR `revalidate` 600. File-based OG and Twitter image |
| `/llms.txt` | text file | `text/plain; charset=utf-8`. Allowed in `robots.ts` for `*` and AI crawlers. Lists public pages and published spots. No fixed spot count. Not an HTML page, so no title or canonical |
| `/spots/[id]` | yes | `generateMetadata` via `spotPageTitle` / `spotPageDescription`, canonical `/spots/{id}`, `spotJsonLd` |
| login, new, mine, edit, auth, api | no | `noIndexRobots`; listed in `robots.ts` `disallow` |

## Verify

After SEO-affecting UI/route changes, hit locally (`npm run dev` on port 3004) and confirm the HTML has the expected `<title>`, canonical, and `noindex` where required. Do not declare the task done if a new public page has no metadata.
