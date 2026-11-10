import { afterEach, describe, expect, it, vi } from "vitest";
import { adminAccessForEmail, adminWriteDecision, isAdminEmail } from "@/lib/admin";

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

describe("adminAccessForEmail", () => {
  it("hides the admin entry from signed-out visitors and other accounts", () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@gmail.com,secret@family.test");
    for (const email of [null, undefined, "", "visitor@gmail.com"]) {
      const hidden = adminAccessForEmail(email, 4);
      expect(hidden).toEqual({ admin: false });
      expect(JSON.stringify(hidden)).not.toContain("secret@family.test");
      expect(JSON.stringify(hidden)).not.toContain("owner@gmail.com");
      expect(hidden).not.toHaveProperty("pendingCount");
    }
  });

  it("shows the entry and the pending count only for an allowlisted email", () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@gmail.com,secret@family.test");
    const shown = adminAccessForEmail("Owner@Gmail.com", 4.9);
    expect(shown).toEqual({ admin: true, pendingCount: 4 });
    expect(JSON.stringify(shown)).not.toContain("secret@family.test");
    expect(JSON.stringify(shown)).not.toContain("@");
    expect(adminAccessForEmail("owner@gmail.com", Number.NaN)).toEqual({
      admin: true,
      pendingCount: 0,
    });
  });
});
