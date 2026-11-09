import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminEmail } from "@/lib/admin";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAdminEmail", () => {
  it("is closed when the allowlist is unset", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdminEmail("owner@gmail.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it("matches a comma-separated list without caring about case or spaces", () => {
    vi.stubEnv("ADMIN_EMAILS", " Owner@Gmail.com, family@example.com ");
    expect(isAdminEmail("owner@gmail.com")).toBe(true);
    expect(isAdminEmail("FAMILY@example.com")).toBe(true);
    expect(isAdminEmail("other@gmail.com")).toBe(false);
  });
});
