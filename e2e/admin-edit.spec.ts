import { expect, test } from "@playwright/test";
import {
  E2E_ADMIN_EMAIL,
  E2E_TEST_ADMIN_HEADER,
  E2E_TEST_USER_HEADER,
} from "../src/lib/e2e/guard";
import { findTypedNodes, headingText, jsonLdBlocks } from "./html";

const ORIGINAL_NAME = "תצפית לפני עריכת מנהל";
const EDITED_NAME = "תצפית אחרי עריכת מנהל";
const MOVED_NAME = "תצפית ירושלים מעודכנת";
const CREDIT = "נועה בדיקה";
const DESCRIPTION = "שקיעה על המים אחרי עדכון של המנהל.";

let spotId: string | null = null;

function originOf(baseURL: string | undefined): string {
  if (!baseURL) throw new Error("Playwright baseURL is not set");
  return new URL(baseURL).origin;
}

function adminHeaders(baseURL: string | undefined): Record<string, string> {
  return { origin: originOf(baseURL), [E2E_TEST_ADMIN_HEADER]: "1" };
}

function userHeaders(baseURL: string | undefined): Record<string, string> {
  return { origin: originOf(baseURL), [E2E_TEST_USER_HEADER]: "1" };
}

function rejectBody() {
  return {
    name: "תצפית שנדחתה בבדיקה",
    description: "",
    lat: 32.08,
    lng: 34.78,
    region: null,
    photoUrl: null,
    status: "rejected",
    contributorName: null,
  };
}

test.afterEach(async ({ request, baseURL }) => {
  if (!spotId) return;
  const id = spotId;
  spotId = null;
  await request
    .patch(`/api/admin/spots/${id}`, {
      headers: adminHeaders(baseURL),
      data: rejectBody(),
      maxRedirects: 0,
    })
    .catch(() => undefined);
});

test("an admin can edit a spot and everyone else is refused", async ({
  browser,
  request,
  baseURL,
}) => {
  test.setTimeout(120_000);
  const origin = originOf(baseURL);

  const created = await request.post("/api/spots/suggestions", {
    headers: { origin },
    data: {
      name: ORIGINAL_NAME,
      description: "הצעה שממתינה לעריכה של מנהל.",
      lat: 32.08,
      lng: 34.78,
      region: "תל אביב",
      contributorName: "דנה",
      clientRequestId: crypto.randomUUID(),
    },
    maxRedirects: 0,
  });
  expect(created.status()).toBe(201);
  const suggestion = (await created.json()) as { id?: string };
  if (!suggestion.id) throw new Error("suggestion did not return an id");
  spotId = suggestion.id;
  const id = suggestion.id;

  const signedOut = await request.patch(`/api/admin/spots/${id}`, {
    headers: { origin },
    data: { ...rejectBody(), status: "approved", name: "שינוי בלי חשבון" },
    maxRedirects: 0,
  });
  expect(signedOut.status()).toBe(403);
  const signedOutText = await signedOut.text();
  expect(signedOutText).toContain("צריך להתחבר כדי לערוך.");
  expect(signedOutText).not.toContain("@");

  const stranger = await request.patch(`/api/admin/spots/${id}`, {
    headers: userHeaders(baseURL),
    data: { ...rejectBody(), status: "approved", name: "שינוי של מישהו אחר" },
    maxRedirects: 0,
  });
  expect(stranger.status()).toBe(403);
  const strangerBody = await stranger.text();
  expect(strangerBody).toContain("אין הרשאה לערוך נקודות.");
  expect(strangerBody).not.toContain(E2E_ADMIN_EMAIL);

  const crossSite = await request.patch(`/api/admin/spots/${id}`, {
    headers: { origin: "https://evil.example", [E2E_TEST_ADMIN_HEADER]: "1" },
    data: { ...rejectBody(), status: "approved" },
    maxRedirects: 0,
  });
  expect(crossSite.status()).toBe(403);

  const signedOutPage = await request.get(`/admin/spots/${id}`, { maxRedirects: 0 });
  expect(signedOutPage.status()).toBeGreaterThanOrEqual(300);
  expect(signedOutPage.status()).toBeLessThan(400);
  expect(signedOutPage.headers().location ?? "").toContain("/login");

  const strangerPage = await request.get(`/admin/spots/${id}`, {
    headers: { [E2E_TEST_USER_HEADER]: "1" },
    maxRedirects: 0,
  });
  expect(strangerPage.status()).toBe(200);
  const strangerHtml = await strangerPage.text();
  expect(strangerHtml).toContain("אין הרשאה לערוך נקודות.");
  expect(strangerHtml).not.toContain(ORIGINAL_NAME);
  expect(strangerHtml).not.toContain("שמירת שינויים");
  expect(strangerHtml).toContain("noindex");

  const context = await browser.newContext({
    extraHTTPHeaders: { [E2E_TEST_ADMIN_HEADER]: "1" },
  });
  await context.addInitScript(() => {
    sessionStorage.setItem("ats-welcome-v2", "1");
  });
  const page = await context.newPage();
  try {
    await page.goto("/admin/spots", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "ניהול נקודות" })).toBeVisible();
    await page.getByRole("link", { name: ORIGINAL_NAME, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/spots/${id}$`));
    await expect(page.getByRole("heading", { level: 1, name: "עריכת נקודה" })).toBeVisible();
    expect(await page.content()).toContain("noindex");

    const name = page.getByLabel("שם", { exact: true });
    await expect(name).toHaveValue(ORIGINAL_NAME);
    await name.fill("א");
    await page.getByRole("button", { name: "שמירת שינויים" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "השם צריך לפחות 2 תווים.",
    );

    await name.fill(EDITED_NAME);
    await page.getByLabel("תיאור", { exact: true }).fill(DESCRIPTION);
    await page.getByLabel("אזור (אופציונלי)").fill("תל אביב–יפו");
    await page.getByLabel("שם המוסיף").fill(CREDIT);
    await page.getByRole("radio", { name: "בתשלום" }).check();
    await page.getByLabel("הערה על החניה (אופציונלי)").fill("חניון קטן ליד הכניסה");
    await page.getByLabel("סטטוס").selectOption("approved");
    await page.getByRole("button", { name: "שמירת שינויים" }).click();

    await expect(page).toHaveURL(new RegExp(`/spots/${id}$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(EDITED_NAME);
    await expect(page.getByText(`נוספה על ידי ${CREDIT}`)).toBeVisible();
    await expect(page.getByRole("link", { name: "עריכת מנהל" })).toBeVisible();

    const userContext = await browser.newContext({
      extraHTTPHeaders: { [E2E_TEST_USER_HEADER]: "1" },
    });
    await userContext.addInitScript(() => {
      sessionStorage.setItem("ats-welcome-v2", "1");
    });
    const userPage = await userContext.newPage();
    try {
      const session = userPage.waitForResponse(
        (response) =>
          response.url().includes("/api/admin/session") && response.status() === 200,
      );
      await userPage.goto(`/spots/${id}`, { waitUntil: "domcontentloaded" });
      await session;
      await expect(userPage.getByRole("link", { name: "עריכת מנהל" })).toHaveCount(0);
    } finally {
      await userContext.close();
    }
  } finally {
    await context.close();
  }

  await expect
    .poll(async () => (await request.get(`/regions/tel-aviv`, { maxRedirects: 0 })).text())
    .toContain(EDITED_NAME);
  await expect
    .poll(async () => (await request.get("/sitemap.xml", { maxRedirects: 0 })).text())
    .toContain(`/spots/${id}`);
  await expect
    .poll(async () => (await request.get("/llms.txt", { maxRedirects: 0 })).text())
    .toContain(EDITED_NAME);

  const moved = await request.patch(`/api/admin/spots/${id}`, {
    headers: adminHeaders(baseURL),
    data: {
      name: MOVED_NAME,
      description: DESCRIPTION,
      lat: 31.7683,
      lng: 35.2137,
      region: "ירושלים",
      photoUrl: null,
      parking: "yes",
      parkingNote: null,
      accessibility: "partial",
      accessibilityNote: "שביל סלול",
      contributorName: CREDIT,
      status: "approved",
    },
    maxRedirects: 0,
  });
  expect(moved.status()).toBe(200);

  await expect
    .poll(async () => {
      const spotPage = await request.get(`/spots/${id}`, { maxRedirects: 0 });
      if (spotPage.status() !== 200) return "";
      return await spotPage.text();
    })
    .toContain(MOVED_NAME);

  const published = await (await request.get(`/spots/${id}`, { maxRedirects: 0 })).text();
  const attractions = jsonLdBlocks(published).flatMap((block) =>
    findTypedNodes(block, "TouristAttraction"),
  );
  expect(attractions).toHaveLength(1);
  const geo = attractions[0]?.geo as { latitude?: number; longitude?: number };
  expect(geo.latitude).toBeCloseTo(31.7683, 4);
  expect(geo.longitude).toBeCloseTo(35.2137, 4);
  expect(headingText(published)).toContain(MOVED_NAME);

  await expect
    .poll(async () => (await request.get("/regions/jerusalem", { maxRedirects: 0 })).text())
    .toContain(MOVED_NAME);
  await expect
    .poll(async () => (await request.get("/llms.txt", { maxRedirects: 0 })).text())
    .toContain(MOVED_NAME);
  await expect
    .poll(async () => (await request.get("/regions/tel-aviv", { maxRedirects: 0 })).text())
    .not.toContain(EDITED_NAME);

  const abroad = await request.patch(`/api/admin/spots/${id}`, {
    headers: adminHeaders(baseURL),
    data: {
      name: MOVED_NAME,
      description: DESCRIPTION,
      lat: 48.85,
      lng: 2.35,
      region: "ירושלים",
      status: "approved",
      contributorName: CREDIT,
    },
    maxRedirects: 0,
  });
  expect(abroad.status()).toBe(400);
  expect(await abroad.text()).toContain("המיקום חייב להיות בתוך ישראל.");

  const stillThere = await (await request.get(`/spots/${id}`, { maxRedirects: 0 })).text();
  expect(headingText(stillThere)).toContain(MOVED_NAME);

  const blockedEdit = await request.patch(`/api/admin/spots/${id}`, {
    headers: userHeaders(baseURL),
    data: {
      name: "עריכה אסורה",
      description: DESCRIPTION,
      lat: 31.77,
      lng: 35.21,
      status: "rejected",
    },
    maxRedirects: 0,
  });
  expect(blockedEdit.status()).toBe(403);

  const rejected = await request.patch(`/api/admin/spots/${id}`, {
    headers: adminHeaders(baseURL),
    data: { ...rejectBody(), name: MOVED_NAME },
    maxRedirects: 0,
  });
  expect(rejected.status()).toBe(200);
  spotId = null;

  await expect
    .poll(async () => (await request.get(`/spots/${id}`, { maxRedirects: 0 })).status())
    .toBe(404);
  await expect
    .poll(async () => (await request.get("/sitemap.xml", { maxRedirects: 0 })).text())
    .not.toContain(`/spots/${id}`);
  await expect
    .poll(async () => (await request.get("/llms.txt", { maxRedirects: 0 })).text())
    .not.toContain(MOVED_NAME);
});
