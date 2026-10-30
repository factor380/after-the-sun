import { JERUSALEM_SUNSET_GUIDE } from "@/lib/guides/jerusalem-sunset";
import { SUNSET_REGIONS, regionPath } from "@/lib/regions";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, truncateMeta } from "@/lib/seo";

/**
 * English opening line of the blockquote. Hebrew site description follows it.
 * Keep this free of a spot count.
 */
export const LLMS_TXT_SUMMARY =
  "A Hebrew community map of sunset-viewing spots in Israel.";

/** Cuid-style ids only, so a spot name cannot break out of the markdown link. */
const SPOT_ID = /^[A-Za-z0-9_-]+$/;
const NOTE_MAX = 180;

export type LlmsSpot = {
  id: string;
  name: string;
  description: string;
  region: string | null;
};

type PageLink = {
  label: string;
  path: string;
  note: string;
};

function oneLine(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

function firstSentence(value: string): string {
  const line = oneLine(value);
  const end = line.search(/[.!?…](?=\s|$)/);
  if (end === -1) return line;
  return line.slice(0, end + 1).trim();
}

function linkLabel(value: string): string {
  const cleaned = oneLine(value).replace(/[\[\]]/g, "");
  return cleaned || "נקודת שקיעה";
}

function markdownLink(label: string, path: string, note: string): string {
  const safeNote = oneLine(note);
  return `- [${linkLabel(label)}](${absoluteUrl(path)}): ${safeNote}`;
}

function pageLinks(): PageLink[] {
  return [
    {
      label: "מפת נקודות השקיעה",
      path: "/",
      note: "המפה הקהילתית של נקודות השקיעה בישראל.",
    },
    {
      label: "אודות",
      path: "/about",
      note: "על המיזם ואיך משתפים נקודת שקיעה.",
    },
    ...SUNSET_REGIONS.map((region) => ({
      label: region.title,
      path: regionPath(region.slug),
      note: firstSentence(region.intro),
    })),
    {
      label: "איפה רואים שקיעה בירושלים?",
      path: JERUSALEM_SUNSET_GUIDE.path,
      note: "מדריך לתצפיות שקיעה בירושלים שפונות מערבה, עם קישור לעמוד של כל נקודה.",
    },
    {
      label: "Sitemap",
      path: "/sitemap.xml",
      note: "מפת האתר של העמודים הציבוריים ונקודות השקיעה.",
    },
  ];
}

function spotNote(spot: LlmsSpot): string {
  const description = oneLine(spot.description);
  const region = oneLine(spot.region ?? "");
  const combined = description
    ? region
      ? `${region}. ${description}`
      : description
    : region
      ? `נקודת שקיעה ב${region}.`
      : "נקודת שקיעה בישראל.";
  return truncateMeta(combined, NOTE_MAX);
}

/** llmstxt.org document. Omits the spot list when `spots` is empty. */
export function buildLlmsTxt(spots: readonly LlmsSpot[] = []): string {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${LLMS_TXT_SUMMARY}`,
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Pages",
    "",
    ...pageLinks().map((page) => markdownLink(page.label, page.path, page.note)),
  ];

  const published = spots.filter((spot) => SPOT_ID.test(spot.id));
  if (published.length > 0) {
    lines.push("", "## Spots", "");
    for (const spot of published) {
      lines.push(
        markdownLink(spot.name, `/spots/${encodeURIComponent(spot.id)}`, spotNote(spot)),
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
