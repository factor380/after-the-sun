import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { JERUSALEM_SUNSET_PLACES } from "../src/lib/guides/jerusalem-sunset";
import { NORTH_GOLAN_SUNSET_PLACES } from "../src/lib/guides/north-golan-sunset";
import { E2E_TEST_ADMIN_HEADER, E2E_TEST_USER_HEADER } from "../src/lib/e2e/guard";
import { E2E_SEED_SPOTS } from "../src/lib/e2e/seed-spots";
import { e2eUploadRoot, resolveE2EUploadPath } from "../src/lib/e2e/upload-path";
import { SUNSET_REGIONS, regionPath } from "../src/lib/regions";
import {
  anchorHrefs,
  documentTitle,
  findTypedNodes,
  headingText,
  internalPath,
  jsonLdBlocks,
  linkHrefs,
  markdownDestinations,
  metaContents,
  normalizePath,
  sitemapLocs,
  toLocalUrl,
} from "./html";

const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "OAI-SearchBot",
];

const GUIDE_SPOT_PATHS = new Set([
  ...JERUSALEM_SUNSET_PLACES.map((place) => place.path),
  ...NORTH_GOLAN_SUNSET_PLACES.map((place) => place.path),
]);

const TINY_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

const SEEDED_SPOT = E2E_SEED_SPOTS.find((spot) => spot.id === "e2e-tel-aviv");
if (!SEEDED_SPOT) throw new Error("missing seeded tel aviv spot");

let createdSpotId: string | null = null;

test.describe.configure({ mode: "serial" });

test.afterEach(async ({ request, baseURL }) => {
  if (!createdSpotId || !baseURL) return;
  const id = createdSpotId;
  createdSpotId = null;
  await request.delete(`/api/spots/${id}`, {
    headers: authHeaders(baseURL),
    maxRedirects: 0,
  });
});

test("public pages, sitemap, robots, and llms.txt", async ({ request, baseURL }) => {
  test.setTimeout(180_000);
  const origin = requireBase(baseURL);
  const required = [
    "/",
    "/regions",
    ...SUNSET_REGIONS.map((region) => regionPath(region.slug)),
    "/about",
    "/spots/new",
    `/spots/${SEEDED_SPOT.id}`,
  ];

  const htmlByPath = new Map<string, string>();

  for (const path of required) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    const body = await response.text();
    expectNoLegacyHost(body, path);
    htmlByPath.set(normalizePath(path), body);
  }

  const sitemap = await request.get("/sitemap.xml", { maxRedirects: 0 });
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  expectNoLegacyHost(sitemapXml, "/sitemap.xml");
  const locs = sitemapLocs(sitemapXml);
  expect(locs.length).toBeGreaterThan(required.length);

  for (const loc of locs) {
    const local = toLocalUrl(loc, origin);
    const url = new URL(local);
    const path = `${url.pathname}${url.search}`;
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), loc).toBe(200);
    const body = await response.text();
    expectNoLegacyHost(body, loc);
    const type = response.headers()["content-type"] ?? "";
    if (type.includes("text/html")) {
      htmlByPath.set(normalizePath(url.pathname), body);
    }
  }

  for (const [path, html] of htmlByPath) {
    await assertSeo(request, origin, path, html);
  }

  const home = htmlByPath.get("/") ?? "";
  const spotHtml = htmlByPath.get(`/spots/${SEEDED_SPOT.id}`) ?? "";
  expect(home).toContain(SEEDED_SPOT.name);
  expect(headingText(spotHtml)).toContain(SEEDED_SPOT.name);

  const attractions = jsonLdBlocks(spotHtml).flatMap((block) =>
    findTypedNodes(block, "TouristAttraction"),
  );
  expect(attractions).toHaveLength(1);
  expect(attractions[0]?.name).toBe(SEEDED_SPOT.name);
  const geo = attractions[0]?.geo;
  expect(geo && typeof geo === "object").toBe(true);
  const coordinates = geo as { "@type"?: string; latitude?: number; longitude?: number };
  expect(coordinates["@type"]).toBe("GeoCoordinates");
  expect(coordinates.latitude).toBeCloseTo(SEEDED_SPOT.lat, 4);
  expect(coordinates.longitude).toBeCloseTo(SEEDED_SPOT.lng, 4);

  await assertInternalLinks(request, origin, htmlByPath);

  const robots = await request.get("/robots.txt", { maxRedirects: 0 });
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expectNoLegacyHost(robotsText, "/robots.txt");
  expect(blanketDisallow(robotsText)).toEqual([]);
  for (const bot of AI_BOTS) {
    const group = robotGroups(robotsText).find((entry) =>
      entry.agents.some((agent) => agent.toLowerCase() === bot.toLowerCase()),
    );
    expect(group, bot).toBeTruthy();
    expect(group?.disallows ?? [], bot).not.toContain("/");
  }

  const llms = await request.get("/llms.txt", { maxRedirects: 0 });
  expect(llms.status()).toBe(200);
  expect(llms.headers()["content-type"] ?? "").toContain("text/plain");
  const llmsText = await llms.text();
  expectNoLegacyHost(llmsText, "/llms.txt");
  const destinations = markdownDestinations(llmsText);
  expect(destinations.length).toBeGreaterThan(0);
  for (const destination of destinations) {
    const local = toLocalUrl(destination, origin);
    const url = new URL(local);
    const response = await request.get(`${url.pathname}${url.search}`, { maxRedirects: 0 });
    expect(response.status(), destination).toBe(200);
  }
});

test("judea-samaria redirects only when this branch defines that redirect", async ({
  request,
}) => {
  const response = await request.get("/regions/judea-samaria", { maxRedirects: 0 });
  const status = response.status();
  if (status !== 301 && status !== 308) {
    expect(status).toBe(200);
    return;
  }
  const location = response.headers().location ?? "";
  const target = new URL(location, "http://localhost:3004");
  expect(normalizePath(target.pathname)).toBe("/regions");
});

test("new spot form works signed out and Enter in place search does not submit", async ({
  page,
}) => {
  await page.goto("/spots/new", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/spots\/new$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("אפשר לשלוח בלי חשבון")).toBeVisible();
  await expect(page.getByText("התחברות עם Google מוסיפה את השם שלכם לנקודה.")).toBeVisible();

  const name = page.getByPlaceholder("תצפית נמל יפו");
  await expect(name).toBeEnabled();
  await expect(page.getByRole("button", { name: "השתמשו במיקום שלי" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "שליחת הצעה" })).toBeEnabled();

  await name.fill("תצפית בדיקה");
  await expect(name).toHaveValue("תצפית בדיקה");

  const search = page.getByRole("textbox", { name: "חיפוש מיקום" });
  await expect(search).toBeVisible();
  await search.evaluate((input) => {
    const form = input.closest("form");
    const root = document.documentElement;
    root.dataset.e2eFormSubmit = "0";
    form?.addEventListener("submit", () => {
      root.dataset.e2eFormSubmit = "1";
    });
    for (const field of form?.querySelectorAll("input, textarea, select") ?? []) {
      field.addEventListener("invalid", () => {
        root.dataset.e2eFormSubmit = "1";
      });
    }
  });
  await search.fill("יפו");
  await search.press("Enter");
  await page.waitForTimeout(500);

  await expect(page).toHaveURL(/\/spots\/new$/);
  await expect(page.locator("html")).toHaveAttribute("data-e2e-form-submit", "0");
  await expect(page.locator("form [role=alert]")).toHaveCount(0);
  await expect(page.getByText("בחרו מיקום על המפה כדי לקבוע את מיקום הנקודה.")).toHaveCount(0);
  await expect(name).toHaveValue("תצפית בדיקה");
});

test("quick add form restores a draft after refresh and the Google login link", async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("ats-welcome-v2", "1");
  });
  await page.goto("/spots/new", { waitUntil: "domcontentloaded" });

  await page.getByPlaceholder("תצפית נמל יפו").fill("תצפית הטיוטה");
  await page.getByLabel("השם שלכם (אופציונלי)").fill("דנה כהן");
  await page.getByText("פרטים נוספים (אפשר להשלים אחר כך)").click();
  await page.getByPlaceholder("למה זו נקודת שקיעה מעולה?").fill("תיאור שנשמר בטיוטה אחרי רענון.");
  await page.getByPlaceholder("תל אביב").fill("יפו");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("הטופס שוחזר. אפשר לשלוח עכשיו.")).toBeVisible();
  await expect(page.getByPlaceholder("תצפית נמל יפו")).toHaveValue("תצפית הטיוטה");
  await expect(page.getByLabel("השם שלכם (אופציונלי)")).toHaveValue("דנה כהן");
  await page.getByText("פרטים נוספים (אפשר להשלים אחר כך)").click();
  await expect(page.getByPlaceholder("למה זו נקודת שקיעה מעולה?")).toHaveValue(
    "תיאור שנשמר בטיוטה אחרי רענון.",
  );
  await expect(page.getByPlaceholder("תל אביב")).toHaveValue("יפו");

  await page.getByRole("link", { name: "המשך עם Google" }).click();
  await expect(page).toHaveURL(/\/login\?next=(?:\/|%2F)spots(?:\/|%2F)new/);
  await page.goto("/spots/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("הטופס שוחזר. אפשר לשלוח עכשיו.")).toBeVisible();
  await expect(page.getByPlaceholder("תצפית נמל יפו")).toHaveValue("תצפית הטיוטה");
  await expect(page.getByLabel("השם שלכם (אופציונלי)")).toHaveValue("דנה כהן");
});

test("parking and accessibility reject unknown values and notes over 200 characters", async ({
  request,
  baseURL,
}) => {
  const origin = requireBase(baseURL);
  const before = await request.get("/api/spots");
  expect(before.status()).toBe(200);
  const beforeCount = (await before.json()).length as number;

  const base = {
    name: "נקודה לא תקינה",
    description: "תיאור ארוך מספיק לבדיקת ולידציה.",
    lat: 32.05,
    lng: 34.75,
    acceptedGuidelines: true,
  };

  const cases = [
    { parking: "street" },
    { parking: "YES" },
    { accessibility: "soon" },
    { parkingNote: "א".repeat(201) },
    { accessibilityNote: "ב".repeat(201) },
  ];

  for (const extra of cases) {
    const response = await request.post("/api/spots", {
      headers: authHeaders(origin),
      data: { ...base, ...extra },
      maxRedirects: 0,
    });
    expect(response.status(), JSON.stringify(extra)).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe("Invalid spot data");
  }

  const after = await request.get("/api/spots");
  expect((await after.json()).length).toBe(beforeCount);
});

test("test user can create, edit, report, and delete a spot with a photo", async ({
  request,
  baseURL,
}) => {
  const origin = requireBase(baseURL);
  const anonymous = await request.post("/api/spots/upload", {
    headers: { origin },
    multipart: {
      file: { name: "sunset.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG },
    },
    maxRedirects: 0,
  });
  expect(anonymous.status()).toBe(401);

  const upload = await request.post("/api/spots/upload", {
    headers: authHeaders(origin),
    multipart: {
      file: { name: "sunset.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG },
    },
    maxRedirects: 0,
  });
  expect(upload.status()).toBe(201);
  const uploaded = (await upload.json()) as { photoUrl?: string };
  const photoUrl = uploaded.photoUrl ?? "";
  expect(photoUrl.startsWith("https://e2e.supabase.co/storage/v1/object/public/spot-photos/")).toBe(
    true,
  );

  const objectPath = decodeURIComponent(
    new URL(photoUrl).pathname.replace("/storage/v1/object/public/spot-photos/", ""),
  );
  const savedPath = resolveE2EUploadPath(e2eUploadRoot(), objectPath);
  if (!savedPath) throw new Error("uploaded photo path escaped the local root");
  const saved = await readFile(savedPath);
  expect(saved[0]).toBe(0xff);
  expect(saved[1]).toBe(0xd8);

  const createdName = "נקודת שער בדיקה";
  const editedName = "נקודת שער אחרי עריכה";
  const created = await request.post("/api/spots", {
    headers: authHeaders(origin),
    data: {
      name: createdName,
      description: "תיאור לבדיקת השער האוטומטי של האתר.",
      lat: 31.77,
      lng: 35.21,
      region: "ירושלים",
      photoUrl,
      parking: "yes",
      parkingNote: "חניון קטן ליד התצפית",
      accessibility: "partial",
      accessibilityNote: "שביל סלול בחלק מהדרך",
      acceptedGuidelines: true,
      clientRequestId: crypto.randomUUID(),
    },
    maxRedirects: 0,
  });
  expect(created.status()).toBe(201);
  const spot = (await created.json()) as { id?: string };
  if (!spot.id) throw new Error("create did not return an id");
  const id = spot.id;
  createdSpotId = id;

  await expect
    .poll(async () => {
      const page = await request.get(`/spots/${id}`, { maxRedirects: 0 });
      if (page.status() !== 200) return "";
      const html = await page.text();
      return html.includes(photoUrl) ? headingText(html) : "";
    })
    .toContain(createdName);

  await expect
    .poll(async () => (await request.get("/sitemap.xml", { maxRedirects: 0 })).text())
    .toContain(`/spots/${id}`);

  const patched = await request.patch(`/api/spots/${id}`, {
    headers: authHeaders(origin),
    data: { name: editedName },
    maxRedirects: 0,
  });
  expect(patched.status()).toBe(200);

  await expect
    .poll(async () => {
      const page = await request.get(`/spots/${id}`, { maxRedirects: 0 });
      if (page.status() !== 200) return "";
      return headingText(await page.text());
    })
    .toContain(editedName);

  const report = await request.post(`/api/spots/${id}/report`, {
    headers: authHeaders(origin),
    data: { reason: "spam", details: "בדיקת שער" },
    maxRedirects: 0,
  });
  expect(report.status()).toBe(201);

  const removed = await request.delete(`/api/spots/${id}`, {
    headers: authHeaders(origin),
    maxRedirects: 0,
  });
  expect(removed.status()).toBe(200);
  createdSpotId = null;

  await expect
    .poll(async () => (await request.get(`/spots/${id}`, { maxRedirects: 0 })).status())
    .toBe(404);

  await expect
    .poll(async () => (await request.get("/sitemap.xml", { maxRedirects: 0 })).text())
    .not.toContain(`/spots/${id}`);
});

test("anonymous suggestion stays hidden until an admin approves it", async ({
  browser,
  request,
  baseURL,
}) => {
  test.setTimeout(120_000);
  const origin = requireBase(baseURL);
  const name = "תצפית הצעה לבדיקה";
  const rejectedName = "תצפית שנדחית בבדיקה";
  const trappedName = "מלכודת דבש לבדיקה";
  const credit = "דנה כהן";

  const created = await request.post("/api/spots/suggestions", {
    headers: { origin },
    data: {
      name,
      lat: 32.08,
      lng: 34.78,
      contributorName: credit,
      clientRequestId: crypto.randomUUID(),
    },
    maxRedirects: 0,
  });
  expect(created.status()).toBe(201);
  const suggestion = (await created.json()) as { id?: string; status?: string };
  if (!suggestion.id) throw new Error("suggestion did not return an id");
  const id = suggestion.id;
  expect(suggestion.status).toBe("pending");

  const rejected = await request.post("/api/spots/suggestions", {
    headers: { origin },
    data: {
      name: rejectedName,
      lat: 32.09,
      lng: 34.79,
      clientRequestId: crypto.randomUUID(),
    },
    maxRedirects: 0,
  });
  expect(rejected.status()).toBe(201);
  const rejectedBody = (await rejected.json()) as { id?: string };
  if (!rejectedBody.id) throw new Error("rejected suggestion did not return an id");
  const rejectedId = rejectedBody.id;

  const trapped = await request.post("/api/spots/suggestions", {
    headers: { origin },
    data: {
      name: trappedName,
      lat: 32.1,
      lng: 34.8,
      website: "https://spam.example",
    },
    maxRedirects: 0,
  });
  expect(trapped.status()).toBe(200);
  const trappedBody = (await trapped.json()) as { id?: string; accepted?: boolean };
  expect(trappedBody.accepted).toBe(true);
  expect(trappedBody.id).toBeUndefined();

  const list = (await (await request.get("/api/spots")).json()) as { id: string }[];
  expect(list.some((spot) => spot.id === id || spot.id === rejectedId)).toBe(false);

  expect((await request.get(`/spots/${id}`, { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get(`/spots/${rejectedId}`, { maxRedirects: 0 })).status()).toBe(404);
  expect(await (await request.get("/")).text()).not.toContain(name);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(`/spots/${id}`);
  expect(await (await request.get("/llms.txt")).text()).not.toContain(name);

  const anonymousEdit = await request.patch(`/api/spots/${id}`, {
    headers: { origin },
    data: { name: "שינוי אנונימי" },
    maxRedirects: 0,
  });
  expect(anonymousEdit.status()).toBe(401);

  const strangerEdit = await request.patch(`/api/spots/${id}`, {
    headers: authHeaders(origin),
    data: { name: "שינוי של מישהו אחר" },
    maxRedirects: 0,
  });
  expect(strangerEdit.status()).toBe(404);

  const signedOutAdmin = await request.get("/admin/suggestions", { maxRedirects: 0 });
  expect(signedOutAdmin.status()).toBeGreaterThanOrEqual(300);
  expect(signedOutAdmin.status()).toBeLessThan(400);

  const context = await browser.newContext({
    extraHTTPHeaders: { [E2E_TEST_ADMIN_HEADER]: "1" },
  });
  await context.addInitScript(() => {
    sessionStorage.setItem("ats-welcome-v2", "1");
  });
  const page = await context.newPage();
  await page.goto("/admin/suggestions", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "הצעות ממתינות" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: rejectedName })).toBeVisible();
  await expect(page.getByText(trappedName)).toHaveCount(0);
  expect(await page.content()).toContain("noindex");

  const rejectedCard = page.locator("li", { hasText: rejectedName });
  await rejectedCard.getByRole("button", { name: "דחייה" }).click();
  await expect(page.getByRole("heading", { level: 2, name: rejectedName })).toHaveCount(0);
  expect((await request.get(`/spots/${rejectedId}`, { maxRedirects: 0 })).status()).toBe(404);

  const approvedCard = page.locator("li", { hasText: name });
  await approvedCard.getByRole("button", { name: "אישור" }).click();
  await expect(page.getByRole("heading", { level: 2, name })).toHaveCount(0);
  await context.close();

  await expect
    .poll(async () => {
      const spotPage = await request.get(`/spots/${id}`, { maxRedirects: 0 });
      if (spotPage.status() !== 200) return "";
      return await spotPage.text();
    })
    .toContain(name);

  const published = await (await request.get(`/spots/${id}`, { maxRedirects: 0 })).text();
  expect(published).toContain(`נוספה על ידי ${credit}`);
  expect(headingText(published)).toContain(name);

  await expect
    .poll(async () => (await request.get("/sitemap.xml", { maxRedirects: 0 })).text())
    .toContain(`/spots/${id}`);
  await expect
    .poll(async () => (await request.get("/llms.txt", { maxRedirects: 0 })).text())
    .toContain(name);

  const visible = (await (await request.get("/api/spots")).json()) as { id: string; name: string }[];
  expect(visible.some((spot) => spot.id === id && spot.name === name)).toBe(true);
  expect(visible.some((spot) => spot.id === rejectedId)).toBe(false);
  await expect.poll(async () => (await request.get("/")).text()).toContain(name);
  expect(await (await request.get("/llms.txt")).text()).not.toContain(rejectedName);

  const editAfterApproval = await request.patch(`/api/spots/${id}`, {
    headers: authHeaders(origin),
    data: { name: "עריכה אחרי אישור" },
    maxRedirects: 0,
  });
  expect(editAfterApproval.status()).toBe(403);
});

function requireBase(baseURL: string | undefined): string {
  if (!baseURL) throw new Error("Playwright baseURL is not set");
  return baseURL;
}

function authHeaders(baseURL: string): Record<string, string> {
  return {
    origin: new URL(baseURL).origin,
    [E2E_TEST_USER_HEADER]: "1",
  };
}

function expectNoLegacyHost(body: string, where: string) {
  expect(body, where).not.toContain("after-the-sun.vercel.app");
}

async function assertSeo(
  request: APIRequestContext,
  baseURL: string,
  pagePath: string,
  html: string,
) {
  expect(documentTitle(html), pagePath).not.toBe("");
  expect(metaContents(html, "name", "description")[0] ?? "", pagePath).not.toBe("");

  const canonical = linkHrefs(html, "canonical")[0];
  expect(canonical, `${pagePath} canonical`).toBeTruthy();
  const canonicalUrl = new URL(canonical ?? "");
  expect(canonicalUrl.origin, pagePath).toBe("https://after-the-sun.com");
  expect(normalizePath(canonicalUrl.pathname), pagePath).toBe(normalizePath(pagePath));

  expect(metaContents(html, "property", "og:title")[0] ?? "", pagePath).not.toBe("");
  expect(metaContents(html, "property", "og:description")[0] ?? "", pagePath).not.toBe("");
  const images = metaContents(html, "property", "og:image");
  expect(images.length, pagePath).toBeGreaterThan(0);
  for (const imageUrl of images) {
    const local = toLocalUrl(imageUrl, baseURL);
    const image = await request.get(local);
    expect(image.status(), `${pagePath} ${imageUrl}`).toBe(200);
    expect(image.headers()["content-type"] ?? "", imageUrl).toContain("image/png");
  }
}

async function assertInternalLinks(
  request: APIRequestContext,
  baseURL: string,
  htmlByPath: Map<string, string>,
) {
  const checked = new Set<string>();
  const skippedGuideSpots = new Set<string>();

  for (const html of htmlByPath.values()) {
    for (const href of anchorHrefs(html)) {
      const path = internalPath(href, baseURL);
      if (!path || checked.has(path)) continue;
      checked.add(path);
      const response = await request.get(path);
      const status = response.status();
      const pathname = normalizePath(path.split("?")[0] ?? path);
      if (status === 404 && GUIDE_SPOT_PATHS.has(pathname)) {
        skippedGuideSpots.add(pathname);
        continue;
      }
      expect(status, path).toBe(200);
    }
  }

  for (const skipped of skippedGuideSpots) {
    expect(GUIDE_SPOT_PATHS.has(skipped), skipped).toBe(true);
  }
}

function blanketDisallow(text: string): string[] {
  return text.split(/\r?\n/).filter((line) => /^\s*disallow:\s*\/\s*$/i.test(line));
}

function robotGroups(text: string): { agents: string[]; disallows: string[] }[] {
  const groups: { agents: string[]; disallows: string[] }[] = [];
  let agents: string[] = [];
  let disallows: string[] = [];

  const flush = () => {
    if (agents.length === 0 && disallows.length === 0) return;
    groups.push({ agents, disallows });
    agents = [];
    disallows = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (disallows.length > 0) flush();
      agents.push(value);
      continue;
    }
    if (key === "disallow") disallows.push(value);
    if (key === "sitemap" || key === "host") flush();
  }
  flush();
  return groups;
}
