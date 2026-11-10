import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminUpdateSpotSchema } from "@/lib/validations/spot";

const { findUnique, update, deleteMany, transaction } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    spot: { findUnique },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

import { adminUpdateSpot } from "@/services/spots";

const base = {
  name: "חוף הילטון",
  description: "תצפית פתוחה לים בשעת השקיעה.",
  lat: 32.09,
  lng: 34.77,
  region: "תל אביב",
  photoUrl: null,
  parking: "paid" as const,
  parkingNote: "חניון",
  accessibility: null,
  accessibilityNote: null,
  contributorName: "דנה\u0000כהן",
  status: "rejected" as const,
};

function parsed(overrides: Record<string, unknown> = {}) {
  return adminUpdateSpotSchema.parse({ ...base, ...overrides });
}

beforeEach(() => {
  findUnique.mockReset();
  update.mockReset();
  deleteMany.mockReset();
  transaction.mockReset();
  transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
    fn({
      spotPhoto: { deleteMany },
      spot: { update },
    }),
  );
  update.mockResolvedValue({
    id: "spot-1",
    name: base.name,
    status: "rejected",
  });
});

describe("adminUpdateSpot", () => {
  it("updates someone else's spot, including status and the credit line", async () => {
    findUnique.mockResolvedValue({
      id: "spot-1",
      createdById: "owner-1",
      photoUrl: null,
      photos: [],
    });

    const result = await adminUpdateSpot("spot-1", parsed({ description: "   " }));

    expect(result?.spot.status).toBe("rejected");
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "spot-1" },
      include: {
        photos: {
          orderBy: { createdAt: "asc" },
          select: { id: true, url: true },
        },
      },
    });
    expect(deleteMany).not.toHaveBeenCalled();
    const data = update.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({
      name: base.name,
      description: "",
      status: "rejected",
      contributorName: "דנה כהן",
      parking: "paid",
      parkingNote: "חניון",
      photoUrl: null,
    });
    expect(data).not.toHaveProperty("createdById");
    expect(result?.removedPhotoUrls).toEqual([]);
  });

  it("returns null when the spot is missing and does not write", async () => {
    findUnique.mockResolvedValue(null);
    await expect(adminUpdateSpot("missing", parsed())).resolves.toBeNull();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("refuses a point outside Israel before deleting photos", async () => {
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: null,
      photos: [{ id: "p1", url: "https://cdn.example/a.jpg" }],
    });
    await expect(
      adminUpdateSpot("spot-1", parsed({ lat: 48.85, lng: 2.35, removePhotoIds: ["p1"] })),
    ).rejects.toThrow(/Israel/);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("refuses a gallery id that is not on this spot", async () => {
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: null,
      photos: [{ id: "p1", url: "https://cdn.example/a.jpg" }],
    });
    await expect(
      adminUpdateSpot("spot-1", parsed({ removePhotoIds: ["p1", "other-spot"] })),
    ).rejects.toThrow("UNKNOWN_PHOTO");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("removes the chosen gallery photo and a replaced cover", async () => {
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: "https://cdn.example/cover.jpg",
      photos: [{ id: "p1", url: "https://cdn.example/gallery.jpg" }],
    });

    const result = await adminUpdateSpot(
      "spot-1",
      parsed({
        photoUrl: null,
        removePhotoIds: ["p1", "p1"],
      }),
    );

    expect(deleteMany).toHaveBeenCalledWith({
      where: { spotId: "spot-1", id: { in: ["p1"] } },
    });
    expect(result?.removedPhotoUrls).toEqual([
      "https://cdn.example/gallery.jpg",
      "https://cdn.example/cover.jpg",
    ]);
    expect(update.mock.calls[0]?.[0].data.photoUrl).toBeNull();
  });

  it("replaces a cover whose gallery file is deleted with the oldest photo that remains", async () => {
    const cover = "https://cdn.example/cover.jpg";
    const older = "https://cdn.example/older.jpg";
    const newer = "https://cdn.example/newer.jpg";
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: cover,
      photos: [
        { id: "older", url: older },
        { id: "cover", url: cover },
        { id: "newer", url: newer },
      ],
    });

    const result = await adminUpdateSpot(
      "spot-1",
      parsed({ photoUrl: cover, removePhotoIds: ["cover", "cover"] }),
    );

    expect(deleteMany).toHaveBeenCalledWith({
      where: { spotId: "spot-1", id: { in: ["cover"] } },
    });
    expect(update.mock.calls[0]?.[0].data.photoUrl).toBe(older);
    expect(result?.removedPhotoUrls).toEqual([cover]);
  });

  it("clears the cover when its gallery file is the last photo", async () => {
    const cover = "https://cdn.example/cover.jpg";
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: cover,
      photos: [{ id: "cover", url: cover }],
    });

    const result = await adminUpdateSpot(
      "spot-1",
      parsed({ photoUrl: cover, removePhotoIds: ["cover"] }),
    );

    expect(update.mock.calls[0]?.[0].data.photoUrl).toBeNull();
    expect(result?.removedPhotoUrls).toEqual([cover]);
  });

  it("keeps a newly chosen cover while deleting the previous cover file", async () => {
    const oldCover = "https://cdn.example/old.jpg";
    const fresh = "https://cdn.example/fresh.jpg";
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: oldCover,
      photos: [{ id: "old", url: oldCover }],
    });

    const result = await adminUpdateSpot(
      "spot-1",
      parsed({ photoUrl: fresh, removePhotoIds: ["old"] }),
    );

    expect(update.mock.calls[0]?.[0].data.photoUrl).toBe(fresh);
    expect(result?.removedPhotoUrls).toEqual([oldCover]);
  });

  it("does not keep a cover that is set to a gallery photo being deleted", async () => {
    const doomed = "https://cdn.example/doomed.jpg";
    const keep = "https://cdn.example/keep.jpg";
    const standalone = "https://cdn.example/standalone.jpg";
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: standalone,
      photos: [
        { id: "doomed", url: doomed },
        { id: "keep", url: keep },
      ],
    });

    const result = await adminUpdateSpot(
      "spot-1",
      parsed({ photoUrl: doomed, removePhotoIds: ["doomed"] }),
    );

    expect(update.mock.calls[0]?.[0].data.photoUrl).toBe(keep);
    expect(result?.removedPhotoUrls).toEqual([doomed, standalone]);
  });

  it("clears a cover set to the only photo being deleted", async () => {
    const doomed = "https://cdn.example/doomed.jpg";
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: doomed,
      photos: [{ id: "doomed", url: doomed }],
    });

    const result = await adminUpdateSpot(
      "spot-1",
      parsed({ photoUrl: doomed, removePhotoIds: ["doomed"] }),
    );

    expect(update.mock.calls[0]?.[0].data.photoUrl).toBeNull();
    expect(result?.removedPhotoUrls).toEqual([doomed]);
  });

  it("keeps a cover that did not change", async () => {
    const cover = "https://cdn.example/cover.jpg";
    findUnique.mockResolvedValue({
      id: "spot-1",
      photoUrl: cover,
      photos: [],
    });

    const result = await adminUpdateSpot("spot-1", parsed({ photoUrl: cover }));

    expect(deleteMany).not.toHaveBeenCalled();
    expect(result?.removedPhotoUrls).toEqual([]);
    expect(update.mock.calls[0]?.[0].data.photoUrl).toBe(cover);
  });
});
