import { expect, test, type Page } from "@playwright/test";
import { E2E_SEED_SPOTS } from "../src/lib/e2e/seed-spots";

const SEEDED_SPOT = E2E_SEED_SPOTS.find((spot) => spot.id === "e2e-tel-aviv");
if (!SEEDED_SPOT) throw new Error("missing seeded tel aviv spot");

const WELCOME_NAME = "איפה רואים שקיעה היום?";

function welcomeDialog(page: Page) {
  return page.getByRole("dialog", { name: WELCOME_NAME });
}

/**
 * The header's admin check flips off "pending" only after hydration and a
 * client fetch. The welcome decision runs in the same mount, one frame
 * earlier, so a settled header means the intro has already opened or stayed shut.
 */
async function settledPage(page: Page) {
  await expect(page.locator("header")).not.toHaveAttribute("data-admin-check", "pending");
}

test("welcome modal shows on the home page for a fresh session", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const dialog = welcomeDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("dir", "rtl");

  await page.getByRole("button", { name: "למפה" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);

  await page.reload({ waitUntil: "domcontentloaded" });
  await settledPage(page);
  await expect(welcomeDialog(page)).toHaveCount(0);
});

test("welcome modal stays closed on a spot page for a fresh session", async ({ page }) => {
  await page.goto(`/spots/${SEEDED_SPOT.id}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: SEEDED_SPOT.name })).toBeVisible();
  await settledPage(page);
  await expect(welcomeDialog(page)).toHaveCount(0);
});

test("welcome modal stays closed on the new-spot form for a fresh session", async ({ page }) => {
  await page.goto("/spots/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await settledPage(page);
  await expect(welcomeDialog(page)).toHaveCount(0);
});

test("welcome modal shows when a fresh session reaches home from a spot page", async ({
  page,
}) => {
  await page.goto(`/spots/${SEEDED_SPOT.id}`, { waitUntil: "domcontentloaded" });
  await settledPage(page);
  await expect(welcomeDialog(page)).toHaveCount(0);

  await page.getByRole("link", { name: "חזרה למפה" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(welcomeDialog(page)).toBeVisible();
});
