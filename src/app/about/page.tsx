import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import {
  CAMPAIGN_GOAL,
  campaignDescription,
  campaignLead,
  campaignTitle,
  campaignWhyNow,
  getCampaignSpotCount,
} from "@/lib/campaign";
import { SITE_NAME, aboutPageJsonLd, indexRobots } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PATH = "/about";

export async function generateMetadata(): Promise<Metadata> {
  const count = await getCampaignSpotCount();
  const title = campaignTitle(count);
  const description = campaignDescription(count);
  const brandedTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: PATH },
    robots: indexRobots,
    openGraph: {
      title: brandedTitle,
      description,
      url: PATH,
      siteName: SITE_NAME,
      locale: "he_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
    },
  };
}

function AddSpotCta() {
  return (
    <div>
      <Link
        href="/spots/new"
        className="inline-flex bg-[var(--ember)] px-5 py-3 font-medium text-white transition hover:brightness-110"
      >
        הוספת נקודה
      </Link>
      <p className="mt-3 text-sm leading-relaxed text-[var(--sand-muted)]">
        לפני ההוספה צריך להתחבר עם Google - זה לוקח רגע.
      </p>
    </div>
  );
}

export default async function AboutPage() {
  const count = await getCampaignSpotCount();
  const title = campaignTitle(count);
  const description = campaignDescription(count);
  const progress = Math.min(100, Math.round((count / CAMPAIGN_GOAL) * 100));

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6 md:pt-10">
      <JsonLd data={aboutPageJsonLd({ title, description })} />

      <p className="text-sm font-medium text-[var(--ember)]">עד סוף אוקטובר 2026</p>
      <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--sand)] md:text-5xl">
        {title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--sand-muted)]">
        {campaignLead(count)}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-[var(--sand)]">
            {count} מתוך {CAMPAIGN_GOAL}
          </span>
          <span className="text-[var(--sand-muted)]">{progress}%</span>
        </div>
        <div
          className="h-1.5 bg-[var(--line)]"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={CAMPAIGN_GOAL}
          aria-valuenow={Math.min(count, CAMPAIGN_GOAL)}
          aria-label={`${count} מתוך ${CAMPAIGN_GOAL} נקודות`}
        >
          <div
            className="h-full bg-[var(--ember)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8">
        <AddSpotCta />
      </div>

      <section className="mt-14 border-t border-[var(--line)] pt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          מה זה After the Sun?
        </h2>
        <p className="mt-4 leading-relaxed text-[var(--sand-muted)]">
          מפה קהילתית של מקומות לראות בהם שקיעה ברחבי הארץ. כל נקודה ממישהו
          שביקר, צילם, וכתב למה שווה להגיע.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          איך מוסיפים נקודה?
        </h2>
        <ol className="mt-4 list-decimal space-y-3 ps-5 leading-relaxed text-[var(--sand)] marker:text-[var(--ember)]">
          <li>הוספת נקודה</li>
          <li>התחברות עם Google - אין הגשת אורח</li>
          <li>מיקום על המפה, תמונה, ותיאור קצר</li>
        </ol>
        <div className="mt-8">
          <AddSpotCta />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          מה הופך הגשה לטובה?
        </h2>
        <ul className="mt-4 list-disc space-y-3 ps-5 leading-relaxed text-[var(--sand-muted)] marker:text-[var(--ember)]">
          <li>תמונה מהשקיעה או מהנוף</li>
          <li>תיאור קצר וייחודי - איפה, מה רואים, מתי, חניה או גישה</li>
          <li>אזור ברור</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          למה עכשיו?
        </h2>
        <p className="mt-4 leading-relaxed text-[var(--sand-muted)]">
          {campaignWhyNow(count)}
        </p>
      </section>

      <section className="mt-12 border-t border-[var(--line)] pt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
          אפשר לעזור היום
        </h2>
        <p className="mt-4 leading-relaxed text-[var(--sand-muted)]">
          הוסיפו נקודה, או חזרו למפה לראות מה כבר יש.
        </p>
        <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <Link
            href="/spots/new"
            className="border border-[var(--line)] px-4 py-2 text-[var(--sand)] transition hover:border-[var(--ember)]"
          >
            הוספת נקודה
          </Link>
          <Link
            href="/"
            className="text-[var(--sand-muted)] underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--sand)]"
          >
            למפה
          </Link>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--sand-muted)]">
          לפני ההוספה צריך להתחבר עם Google - זה לוקח רגע.
        </p>
      </section>
    </article>
  );
}
