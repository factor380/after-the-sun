import { afterEach, describe, expect, it, vi } from "vitest";
import { hostnameFromHostHeader, isE2ETestHarnessEnabled } from "@/lib/e2e/guard";

const KEYS = ["E2E_TEST_AUTH", "VERCEL_ENV", "VERCEL", "NODE_ENV"] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

function env(values: Partial<Record<(typeof KEYS)[number], string | undefined>>) {
  for (const key of KEYS) {
    const value = values[key];
    if (value === undefined) vi.stubEnv(key, "");
    else vi.stubEnv(key, value);
  }
}

describe("isE2ETestHarnessEnabled", () => {
  it("stays off when the flag is missing", () => {
    env({ NODE_ENV: "development" });
    expect(isE2ETestHarnessEnabled()).toBe(false);
    expect(isE2ETestHarnessEnabled("127.0.0.1")).toBe(false);
  });

  it("rejects any flag value other than 1", () => {
    env({ E2E_TEST_AUTH: "true", NODE_ENV: "test" });
    expect(isE2ETestHarnessEnabled()).toBe(false);
  });

  it("turns on for local next start when the flag is set and Vercel is absent", () => {
    env({ E2E_TEST_AUTH: "1", NODE_ENV: "production" });
    expect(isE2ETestHarnessEnabled("127.0.0.1")).toBe(true);
    expect(isE2ETestHarnessEnabled("localhost")).toBe(true);
  });

  it("turns on for the vitest and dev runtimes", () => {
    env({ E2E_TEST_AUTH: "1", NODE_ENV: "test" });
    expect(isE2ETestHarnessEnabled()).toBe(true);
    env({ E2E_TEST_AUTH: "1", NODE_ENV: "development" });
    expect(isE2ETestHarnessEnabled()).toBe(true);
  });

  it("stays off on Vercel production even if every other switch is on", () => {
    env({
      E2E_TEST_AUTH: "1",
      NODE_ENV: "development",
      VERCEL_ENV: "production",
      VERCEL: "1",
    });
    expect(isE2ETestHarnessEnabled()).toBe(false);
    expect(isE2ETestHarnessEnabled("localhost")).toBe(false);
  });

  it("stays off on any Vercel runtime", () => {
    env({ E2E_TEST_AUTH: "1", NODE_ENV: "production", VERCEL: "1" });
    expect(isE2ETestHarnessEnabled()).toBe(false);
  });

  it("stays off for the public production hostnames", () => {
    env({ E2E_TEST_AUTH: "1", NODE_ENV: "production" });
    expect(isE2ETestHarnessEnabled("after-the-sun.com")).toBe(false);
    expect(isE2ETestHarnessEnabled("www.after-the-sun.com")).toBe(false);
    expect(isE2ETestHarnessEnabled("after-the-sun.vercel.app")).toBe(false);
  });

  it("stays off when NODE_ENV is missing", () => {
    env({ E2E_TEST_AUTH: "1" });
    expect(isE2ETestHarnessEnabled("127.0.0.1")).toBe(false);
  });
});

describe("hostnameFromHostHeader", () => {
  it("drops the port and keeps an ipv6 host", () => {
    expect(hostnameFromHostHeader("127.0.0.1:3004")).toBe("127.0.0.1");
    expect(hostnameFromHostHeader("localhost:3004")).toBe("localhost");
    expect(hostnameFromHostHeader("[::1]:3004")).toBe("::1");
    expect(hostnameFromHostHeader(null)).toBeNull();
  });
});
