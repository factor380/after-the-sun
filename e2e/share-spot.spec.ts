import { expect, test } from "@playwright/test";
import { E2E_SEED_SPOTS } from "../src/lib/e2e/seed-spots";

const SEEDED_SPOT = E2E_SEED_SPOTS.find((spot) => spot.id === "e2e-tel-aviv");
if (!SEEDED_SPOT) throw new Error("missing seeded tel aviv spot");

const SPOT_URL = `https://after-the-sun.com/spots/${SEEDED_SPOT.id}`;
const SHARE_TEXT = `נקודת שקיעה: ${SEEDED_SPOT.name} | After the Sun`;

test("share button copies the canonical spot URL when the share sheet is unavailable", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    for (const key of ["share", "canShare"] as const) {
      Object.defineProperty(navigator, key, {
        configurable: true,
        writable: true,
        value: undefined,
      });
    }
  });

  await page.goto(`/spots/${SEEDED_SPOT.id}`, { waitUntil: "domcontentloaded" });

  await expect
    .poll(() => page.evaluate(() => typeof navigator.share))
    .toBe("undefined");

  const button = page.getByRole("button", {
    name: "שיתוף הנקודה",
    exact: true,
  });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.focus();
  await expect(button).toBeFocused();

  const whatsApp = page.getByRole("link", {
    name: "שיתוף בוואטסאפ",
    exact: true,
  });
  await expect(whatsApp).toBeVisible();
  const href = await whatsApp.getAttribute("href");
  expect(href).toBeTruthy();
  const message = new URL(href ?? "").searchParams.get("text");
  expect(message).toContain(SHARE_TEXT);
  expect(message).toContain(SPOT_URL);
  expect(message).not.toContain("utm_");

  await button.click();

  await expect(page.getByRole("status")).toHaveText("הקישור הועתק");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(SPOT_URL);
});
