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
2. Private page (`/login`, `/spots/new`, `/spots/mine`, `/spots/[slug]/edit`, `/auth/*`, `/api/*`)? `robots: noIndexRobots`.
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
- The home `default` title is `HOME_TITLE`: Hebrew tagline first, then the brand (`נקודות שקיעה בישראל | After the Sun`). Do not put the Latin brand first — RTL mobile results truncate it.
- `/about` uses the stable `ABOUT_PAGE_TITLE`. Do not put the live spot count in that title, its og/twitter title, or the about JSON-LD name. The count stays in the description and the page body.
- OG images: default `src/app/opengraph-image.tsx` (`/opengraph-image`, 1200×630). Spot pages use the cover photo when it is a public https URL; otherwise they use that same default image. Do not generate a per-spot card. `twitter:card` stays `summary_large_image`, and `spotJsonLd` uses the same image URL. `/regions` has its own `opengraph-image.tsx` and `twitter-image.tsx`; a page `openGraph` block without those files drops the root card.

## Page types

| Route | Index? | Required |
|---|---|---|
| `/` | yes | canonical `/`, `HOME_TITLE` (Hebrew first), `websiteJsonLd` (`name` is the brand, `alternateName` is the Hebrew tagline) + `spotsItemListJsonLd`, crawlable spot links, `h1` |
| `/about` | yes | stable `ABOUT_PAGE_TITLE` (no live count) + description, canonical `/about`, `h1` matching that title, `aboutPageJsonLd`. `/50` 308s here and stays out of the sitemap. The goal is 75 spots by the end of 2026; the live count comes from published spots and stays in the description and body, not the title |
| `/regions` | yes | unique title + description from `REGIONS_INDEX`, canonical `/regions` via `getSiteUrl()` / `absoluteUrl()`, `h1`, a link to every `/regions/{slug}`, spot counts when the database answers, `regionsIndexJsonLd` (CollectionPage + ItemList), file-based `opengraph-image` and `twitter-image` (the page `openGraph` block does not inherit the root card) |
| `/regions/[slug]` | yes | unique title + description from `SUNSET_REGIONS`, canonical `/regions/{slug}`, `h1`, visible spot links, `regionPageJsonLd` (ItemList + BreadcrumbList). Unknown slugs 404. `/regions/judea-samaria` 308s to `/regions` and stays out of the sitemap and llms.txt |
| `/guides/jerusalem-sunset` | yes | unique title + description, canonical `/guides/jerusalem-sunset`, `h1`, `guideArticleJsonLd` (Article image is the Gan HaKipod share card, plus FAQPage + Place ItemList). ISR `revalidate` 600. File-based OG and Twitter image |
| `/guides/north-golan-sunset` | yes | unique title + description, canonical `/guides/north-golan-sunset`, `h1`, `guideArticleJsonLd` (Article, FAQPage, Place ItemList, BreadcrumbList to `/regions/haifa-north`). ISR `revalidate` 600. File-based OG and Twitter image. There is no `/regions/golan` page |
| `/guides/winter-coast-sunset` | yes | unique title + description, canonical `/guides/winter-coast-sunset`, `h1`, `guideArticleJsonLd` (Article, FAQPage, Place ItemList, BreadcrumbList to `/regions/tel-aviv`). ISR `revalidate` 600. File-based OG and Twitter image. Also linked from `/regions/sharon-coast`, `/regions/haifa-north`, and `/regions/south-shfela` |
| `/llms.txt` | text file | `text/plain; charset=utf-8`. Allowed in `robots.ts` for `*` and AI crawlers. Lists public pages and published spots. No fixed spot count. Not an HTML page, so no title or canonical |
| `/spots/[slug]` | yes | `generateMetadata` via `spotPageTitle` / `spotPageDescription`, canonical `/spots/{slug}`, `spotJsonLd`. `/spots/<cuid>` and any other non-canonical key 308 to that slug. Unknown keys 404 |
| login, new, mine, edit, admin, auth, api | no | `noIndexRobots`; listed in `robots.ts` `disallow`. `/admin/suggestions` is the suggestion queue. Pages with their own title also set `pageSocialMetadata` so og:title, twitter:title, and og:url are that page (`%s | After the Sun`, absolute canonical) instead of the home title and URL. No separate image file: the helper keeps the default card |

## Verify

After SEO-affecting UI/route changes, hit locally (`npm run dev` on port 3004) and confirm the HTML has the expected `<title>`, canonical, and `noindex` where required. Do not declare the task done if a new public page has no metadata.
