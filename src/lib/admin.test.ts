import { afterEach, describe, expect, it, vi } from "vitest";
import { adminWriteDecision, isAdminEmail } from "@/lib/admin";

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

describe("adminWriteDecision", () => {
  it("refuses a signed-out caller and a signed-in non-admin with 403", () => {
    vi.stubEnv("ADMIN_EMAILS", "secret-admin@gmail.com");
    expect(adminWriteDecision(null)).toEqual({
      ok: false,
      status: 403,
      reason: "signed-out",
    });
    expect(adminWriteDecision({ id: "", email: "secret-admin@gmail.com" })).toEqual({
      ok: false,
      status: 403,
      reason: "signed-out",
    });
    const refused = adminWriteDecision({
      id: "user-1",
      email: "other@gmail.com",
    });
    expect(refused).toEqual({ ok: false, status: 403, reason: "forbidden" });
    expect(JSON.stringify(refused)).not.toContain("secret-admin@gmail.com");
    expect(JSON.stringify(refused)).not.toContain("other@gmail.com");
  });

  it("allows an admin id and does not return the email or the allowlist", () => {
    vi.stubEnv("ADMIN_EMAILS", " secret-admin@gmail.com ");
    const allowed = adminWriteDecision({
      id: "admin-1",
      email: "Secret-Admin@gmail.com",
    });
    expect(allowed).toEqual({ ok: true, userId: "admin-1" });
    expect(JSON.stringify(allowed)).not.toContain("@");
    expect(adminWriteDecision({ id: "user-2" }).ok).toBe(false);
  });
});
