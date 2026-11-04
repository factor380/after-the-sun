const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

export function decodeHtml(value: string): string {
  return value
    .replace(/&(?:amp|quot|#39|apos|lt|gt);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    );
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"),
  );
  if (!match) return null;
  return decodeHtml(match[1] ?? match[2] ?? "");
}

function tags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

export function documentTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeHtml(match?.[1] ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function metaContents(
  html: string,
  keyName: "name" | "property",
  key: string,
): string[] {
  const wanted = key.toLowerCase();
  const contents: string[] = [];
  for (const tag of tags(html, "meta")) {
    if (attr(tag, keyName)?.toLowerCase() !== wanted) continue;
    const content = attr(tag, "content");
    if (content) contents.push(content.trim());
  }
  return contents;
}

export function linkHrefs(html: string, rel: string): string[] {
  const wanted = rel.toLowerCase();
  const hrefs: string[] = [];
  for (const tag of tags(html, "link")) {
    const value = attr(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
    if (!value.includes(wanted)) continue;
    const href = attr(tag, "href");
    if (href) hrefs.push(href);
  }
  return hrefs;
}

export function anchorHrefs(html: string): string[] {
  const hrefs: string[] = [];
  for (const tag of tags(html, "a")) {
    const href = attr(tag, "href");
    if (href) hrefs.push(href);
  }
  return hrefs;
}

export function headingText(html: string): string {
  const headings = html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  return [...headings]
    .map((match) =>
      decodeHtml(match[1] ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join(" ");
}

export function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern =
    /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    blocks.push(JSON.parse(match[1] ?? ""));
  }
  return blocks;
}

export function findTypedNodes(
  value: unknown,
  typeName: string,
  found: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    for (const item of value) findTypedNodes(item, typeName, found);
    return found;
  }
  const record = value as Record<string, unknown>;
  const nodeType = record["@type"];
  const types = Array.isArray(nodeType) ? nodeType : [nodeType];
  if (types.includes(typeName)) found.push(record);
  for (const child of Object.values(record)) findTypedNodes(child, typeName, found);
  return found;
}

export function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    decodeHtml(match[1] ?? "").trim(),
  );
}

export function markdownDestinations(text: string): string[] {
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1] ?? "");
}

const LOCAL_HOSTS = new Set([
  "127.0.0.1",
  "localhost",
  "::1",
  "after-the-sun.com",
  "www.after-the-sun.com",
]);

/** Same-site path, or null when the href is external or not a link. */
export function internalPath(href: string, baseURL: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("geo:") ||
    lower.startsWith("data:")
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed, baseURL);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "after-the-sun.vercel.app") {
    throw new Error(`link points at after-the-sun.vercel.app (${trimmed})`);
  }
  if (!LOCAL_HOSTS.has(host)) return null;
  return `${url.pathname}${url.search}`;
}

export function toLocalUrl(value: string, baseURL: string): string {
  const base = new URL(baseURL);
  const url = new URL(value, base);
  const host = url.hostname.toLowerCase();
  if (host === "after-the-sun.vercel.app") {
    throw new Error(`URL points at after-the-sun.vercel.app (${value})`);
  }
  if (
    host === base.hostname ||
    host === "after-the-sun.com" ||
    host === "www.after-the-sun.com"
  ) {
    return `${base.origin}${url.pathname}${url.search}`;
  }
  return url.href;
}

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}
