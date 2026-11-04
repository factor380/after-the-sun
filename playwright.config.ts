import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3004";
const hostname = new URL(baseURL).hostname;
if (hostname !== "127.0.0.1" && hostname !== "localhost" && hostname !== "::1") {
  throw new Error("E2E_BASE_URL must be a local address");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx next start -p 3004 -H 127.0.0.1",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
