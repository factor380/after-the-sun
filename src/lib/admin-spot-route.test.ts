import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dictionary } from "@/lib/i18n/dictionaries";

const { getUser, remove, adminUpdateSpot, revalidatePublishedSpots } = vi.hoisted(() => ({
  getUser: vi.fn(),
  remove: vi.fn(),
  adminUpdateSpot: vi.fn(),
  revalidatePublishedSpots: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    storage: { from: () => ({ remove }) },
  }),
}));

vi.mock("@/lib/revalidate-public", () => ({
  revalidatePublishedSpots,
}));

vi.mock("@/services/spots", () => ({
  adminUpdateSpot,
}));

import { GET } from "@/app/api/admin/session/route";
import { PATCH } from "@/app/api/admin/spots/[id]/route";

const ADMIN_EMAIL = "secret-admin@gmail.com";
const SPOT_ID = "spot-1";

const validBody = {
  name: "חוף הילטון",
  description: "תצפית פתוחה לים בשעת השקיעה.",
  lat: 32.09,
  lng: 34.77,
  region: "תל אביב",
  photoUrl: null,
  parking: "paid",
  parkingNote: "חניון",
  accessibility: null,
  accessibilityNote: null,
  contributorName: "דנה",
  status: "approved",
  removePhotoIds: [] as string[],
};

function patch(body: unknown, origin = "http://localhost:3004") {
  return PATCH(
    new Request(`http://localhost:3004/api/admin/spots/${SPOT_ID}`, {
      method: "PATCH",
      headers: {
        origin,
        "content-type": "application/json",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: SPOT_ID }) },
  );
}

beforeEach(() => {
  vi.stubEnv("ADMIN_EMAILS", ADMIN_EMAIL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://e2e.supabase.co");
  getUser.mockReset();
  remove.mockReset();
  adminUpdateSpot.mockReset();
  revalidatePublishedSpots.mockReset();
  remove.mockResolvedValue({ error: null });
  getUser.mockResolvedValue({
    data: { user: { id: "admin-1", email: ADMIN_EMAIL } },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("PATCH /api/admin/spots/[id]", () => {
  it("rejects a cross-site request before looking at the account", async () => {
    const response = await patch(validBody, "https://evil.example");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: dictionary.adminRequestBlocked });
    expect(getUser).not.toHaveBeenCalled();
    expect(adminUpdateSpot).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-out caller and does not echo the allowlist", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await patch({ status: "approved" });
    const text = await response.text();
    expect(response.status).toBe(403);
    expect(text).toContain(dictionary.adminNeedSignIn);
    expect(text).not.toContain(ADMIN_EMAIL);
    expect(text).not.toContain("@");
    expect(adminUpdateSpot).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-admin even with a valid body", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "other@gmail.com" } },
      error: null,
    });
    const response = await patch(validBody);
    const text = await response.text();
    expect(response.status).toBe(403);
    expect(text).toContain(dictionary.adminForbiddenEdit);
    expect(text).not.toContain(ADMIN_EMAIL);
    expect(text).not.toContain("other@gmail.com");
    expect(adminUpdateSpot).not.toHaveBeenCalled();
    expect(revalidatePublishedSpots).not.toHaveBeenCalled();
  });

  it("returns a Hebrew validation error and does not write", async () => {
    const response = await patch({ ...validBody, name: "א" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: dictionary.adminNameTooShort });
    expect(adminUpdateSpot).not.toHaveBeenCalled();
  });

  it("returns Hebrew for a broken body, a missing spot, and a point outside Israel", async () => {
    const broken = await patch("{");
    expect(broken.status).toBe(400);
    expect(await broken.json()).toEqual({ error: dictionary.adminInvalidSpot });

    adminUpdateSpot.mockResolvedValueOnce(null);
    const missing = await patch(validBody);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: dictionary.adminSpotNotFound });

    adminUpdateSpot.mockRejectedValueOnce(new Error("Location must be within Israel bounds"));
    const abroad = await patch({ ...validBody, lat: 48.85, lng: 2.35 });
    expect(abroad.status).toBe(400);
    expect(await abroad.json()).toEqual({ error: dictionary.locationOutsideIsrael });
    expect(revalidatePublishedSpots).not.toHaveBeenCalled();
  });

  it("saves as an admin, revalidates public pages, and does not return emails", async () => {
    const cover = "https://cdn.example/old.jpg";
    adminUpdateSpot.mockResolvedValue({
      spot: { id: SPOT_ID, name: "חוף חדש", status: "approved" },
      removedPhotoUrls: [
        "https://e2e.supabase.co/storage/v1/object/public/spot-photos/admin/old.jpg",
        cover,
      ],
    });

    const response = await patch(validBody);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ id: SPOT_ID, name: "חוף חדש", status: "approved" });
    expect(Object.keys(body)).toEqual(["id", "name", "status"]);
    expect(JSON.stringify(body)).not.toContain(ADMIN_EMAIL);
    expect(adminUpdateSpot).toHaveBeenCalledWith(
      SPOT_ID,
      expect.objectContaining({ name: validBody.name, status: "approved" }),
    );
    expect(revalidatePublishedSpots).toHaveBeenCalledWith(SPOT_ID);
    expect(remove).toHaveBeenCalledWith(["admin/old.jpg"]);
  });
});

describe("GET /api/admin/session", () => {
  it("reports only a boolean and never the allowlist", async () => {
    const admin = await GET();
    expect(admin.headers.get("cache-control")).toContain("no-store");
    const adminBody = await admin.json();
    expect(adminBody).toEqual({ admin: true });
    expect(Object.keys(adminBody)).toEqual(["admin"]);

    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "other@gmail.com" } },
      error: null,
    });
    const user = await GET();
    const text = await user.text();
    expect(text).toBe('{"admin":false}');
    expect(text).not.toContain(ADMIN_EMAIL);
    expect(text).not.toContain("other@gmail.com");

    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await (await GET()).json()).toEqual({ admin: false });
  });
});
