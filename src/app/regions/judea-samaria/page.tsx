import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { T } from "@/components/T";
import { SUNSET_REGIONS, regionPath } from "@/lib/regions";
import { SITE_NAME, indexRobots, regionPageJsonLd, truncateMeta } from "@/lib/seo";

const PATH = "/regions/judea-samaria";
const TITLE = "נקודות שקיעה ביהודה ובשומרון";
const DESCRIPTION =
  "העמוד המשותף ליהודה ושומרון חולק לשתי רשימות: יהודה, ושומרון ובנימין. בחרו את האזור כדי לראות את נקודות השקיעה.";

const SPLIT = [
  { slug: "judea", blurb: "גוש עציון, הר חברון, אפרת, תקוע ויישובים אחרים ביהודה." },
  { slug: "samaria", blurb: "שומרון, בנימין, אריאל, עפרה, אלקנה ויישובים אחרים באזור." },
] as const;

export const metadata: Metadata = {
  title: TITLE,
  description: truncateMeta(DESCRIPTION),
  alternates: { canonical: PATH },
  robots: indexRobots,
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: truncateMeta(DESCRIPTION),
    url: PATH,
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${SITE_NAME}`,
    description: truncateMeta(DESCRIPTION),
  },
};

export default function JudeaSamariaHubPage() {
  const split = SPLIT.map((item) => {
    const region = SUNSET_REGIONS.find((entry) => entry.slug === item.slug);
    return { ...item, region };
  });

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6 md:pt-10">
      <JsonLd
        data={regionPageJsonLd({
          title: TITLE,
          description: DESCRIPTION,
          path: PATH,
          spots: null,
        })}
      />

      <Link
        href="/"
        className="inline-flex items-center text-sm text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
      >
        <span aria-hidden className="me-1 inline-block rtl:-scale-x-100">
          ←
        </span>
        <T k="backToMap" />
      </Link>

      <p className="mt-6 text-sm font-medium text-[var(--ember)]">יהודה ושומרון</p>
      <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--sand)] md:text-5xl">
        {TITLE}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--sand-muted)]">
        הרשימה המשותפת חולקה לשני אזורים. הנקודות עצמן מופיעות רק באחד משני העמודים.
      </p>

      <ul className="mt-10 space-y-6">
        {split.map((item) =>
          item.region ? (
            <li key={item.slug}>
              <Link
                href={regionPath(item.region.slug)}
                className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--ember)]"
              >
                {item.region.title}
              </Link>
              <p className="mt-2 leading-relaxed text-[var(--sand-muted)]">{item.blurb}</p>
            </li>
          ) : null,
        )}
      </ul>

      <nav className="mt-14 border-t border-[var(--line)] pt-8" aria-label="אזורים נוספים">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          אזורים נוספים
        </h2>
        <ul className="mt-4 space-y-3">
          {SUNSET_REGIONS.filter((region) => region.slug !== "judea" && region.slug !== "samaria").map(
            (region) => (
              <li key={region.slug}>
                <Link
                  href={regionPath(region.slug)}
                  className="text-[var(--sand)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--ember)]"
                >
                  {region.title}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
    </article>
  );
}
