import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUnique,
  update,
  deleteSpotRow,
  photoFindUnique,
  deletePhoto,
  transaction,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  deleteSpotRow: vi.fn(),
  photoFindUnique: vi.fn(),
  deletePhoto: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    spot: {
      findUnique,
      update,
      delete: deleteSpotRow,
    },
    spotPhoto: { findUnique: photoFindUnique, delete: deletePhoto },
    $transaction: transaction,
  },
}));

import { deleteSpotPhoto, SpotPhotoError } from "@/services/spot-photos";
import { deleteSpot, updateSpot } from "@/services/spots";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_ID = "00000000-0000-4000-8000-000000000002";

function storedSpot(createdById: string | null, status = "approved") {
  return {
    id: "spot-1",
    createdById,
    status,
    lat: 31.34,
    lng: 35.05,
    name: "יער יתיר",
    description: "",
  };
}

function storedPhoto(uploadedById: string | null, createdById: string | null) {
  return {
    id: "photo-1",
    url: "https://example.supabase.co/storage/v1/object/public/spot-photos/a.jpg",
    spotId: "spot-1",
    uploadedById,
    spot: { createdById },
  };
}

beforeEach(() => {
  findUnique.mockReset();
  update.mockReset();
  deleteSpotRow.mockReset();
  photoFindUnique.mockReset();
  deletePhoto.mockReset();
  transaction.mockReset();
  update.mockResolvedValue({ id: "spot-1" });
  deleteSpotRow.mockResolvedValue({ id: "spot-1" });
  transaction.mockResolvedValue([]);
});

describe("updateSpot ownership", () => {
  it("rejects a signed-in user when the spot has no creator", async () => {
    findUnique.mockResolvedValue(storedSpot(null));

    await expect(
      updateSpot("spot-1", USER_ID, { name: "שם אחר" }),
    ).rejects.toThrow("FORBIDDEN");
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a missing user id on an unclaimed spot", async () => {
    findUnique.mockResolvedValue(storedSpot(null));

    await expect(
      updateSpot("spot-1", null as unknown as string, { name: "שם אחר" }),
    ).rejects.toThrow("FORBIDDEN");
    expect(update).not.toHaveBeenCalled();
  });

  it("updates when the signed-in user is the creator", async () => {
    findUnique.mockResolvedValue(storedSpot(USER_ID));

    await updateSpot("spot-1", USER_ID, { name: "יער יתיר" });

    expect(update).toHaveBeenCalledOnce();
  });
});

describe("deleteSpot ownership", () => {
  it("rejects a signed-in user when the spot has no creator", async () => {
    findUnique.mockResolvedValue(storedSpot(null));

    await expect(deleteSpot("spot-1", USER_ID)).rejects.toThrow("FORBIDDEN");
    expect(deleteSpotRow).not.toHaveBeenCalled();
  });

  it("rejects a missing user id on an unclaimed spot", async () => {
    findUnique.mockResolvedValue(storedSpot(null));

    await expect(
      deleteSpot("spot-1", null as unknown as string),
    ).rejects.toThrow("FORBIDDEN");
    expect(deleteSpotRow).not.toHaveBeenCalled();
  });

  it("deletes when the signed-in user is the creator", async () => {
    findUnique.mockResolvedValue(storedSpot(USER_ID));

    await deleteSpot("spot-1", USER_ID);

    expect(deleteSpotRow).toHaveBeenCalledOnce();
  });
});

describe("deleteSpotPhoto ownership", () => {
  it("rejects a signed-in user who is neither uploader nor creator", async () => {
    photoFindUnique.mockResolvedValue(storedPhoto(OTHER_ID, null));

    await expect(deleteSpotPhoto("spot-1", "photo-1", USER_ID)).rejects.toBeInstanceOf(
      SpotPhotoError,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a missing user id when the photo and spot have no owner", async () => {
    photoFindUnique.mockResolvedValue(storedPhoto(null, null));

    await expect(
      deleteSpotPhoto("spot-1", "photo-1", null as unknown as string),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("lets the uploader delete a photo on an unclaimed spot", async () => {
    photoFindUnique.mockResolvedValue(storedPhoto(USER_ID, null));

    await deleteSpotPhoto("spot-1", "photo-1", USER_ID);

    expect(transaction).toHaveBeenCalledOnce();
  });

  it("lets the spot creator delete another person's photo", async () => {
    photoFindUnique.mockResolvedValue(storedPhoto(OTHER_ID, USER_ID));

    await deleteSpotPhoto("spot-1", "photo-1", USER_ID);

    expect(transaction).toHaveBeenCalledOnce();
  });
});
