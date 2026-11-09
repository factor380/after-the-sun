import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { upsert, findUnique, findFirst, create, updateMany } = vi.hoisted(() => ({
  upsert: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { upsert },
    spot: { findUnique, findFirst, create, updateMany },
  },
}));

import { createSpot, createSuggestion, moderateSuggestion } from "@/services/spots";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const REQUEST_ID = "550e8400-e29b-41d4-a716-446655440000";

const input = {
  name: "חוף הילטון",
  description: "תצפית פתוחה לים בשעת השקיעה.",
  lat: 32.09,
  lng: 34.77,
  acceptedGuidelines: true as const,
  clientRequestId: REQUEST_ID,
};

function storedSpot() {
  return {
    id: "spot-1",
    name: input.name,
    description: input.description,
    lat: input.lat,
    lng: input.lng,
    region: null,
    photoUrl: null,
    createdById: USER_ID,
    clientRequestId: REQUEST_ID,
    createdAt: new Date("2026-10-26T12:00:00.000Z"),
    updatedAt: new Date("2026-10-26T12:00:00.000Z"),
    photos: [],
  };
}

function uniqueViolation() {
  return new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (`createdById`,`client_request_id`)",
    {
      code: "P2002",
      clientVersion: "test",
      meta: { target: ["createdById", "client_request_id"] },
    },
  );
}

beforeEach(() => {
  upsert.mockReset();
  findUnique.mockReset();
  findFirst.mockReset();
  create.mockReset();
  updateMany.mockReset();
  upsert.mockResolvedValue({ id: USER_ID, displayName: null });
});

describe("createSpot idempotent replay", () => {
  it("returns the existing spot and does not insert or consume a rate limit", async () => {
    const spot = storedSpot();
    findUnique.mockResolvedValue(spot);
    const consumeRateLimit = vi.fn(() => true);

    const result = await createSpot(USER_ID, input, { consumeRateLimit });

    expect(result).toEqual({ ok: true, created: false, spot });
    expect(create).not.toHaveBeenCalled();
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        createdById_clientRequestId: {
          createdById: USER_ID,
          clientRequestId: REQUEST_ID,
        },
      },
      include: expect.any(Object),
    });
  });

  it("does not let the rate limit block a replay that lands after the check", async () => {
    const spot = storedSpot();
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(spot);
    const consumeRateLimit = vi.fn(() => false);

    const result = await createSpot(USER_ID, input, { consumeRateLimit });

    expect(result).toEqual({ ok: true, created: false, spot });
    expect(create).not.toHaveBeenCalled();
    expect(consumeRateLimit).toHaveBeenCalledTimes(1);
  });

  it("rate-limits a new submit when no row exists for the key", async () => {
    findUnique.mockResolvedValue(null);
    const consumeRateLimit = vi.fn(() => false);

    const result = await createSpot(USER_ID, input, { consumeRateLimit });

    expect(result).toEqual({ ok: false, reason: "rate_limited" });
    expect(create).not.toHaveBeenCalled();
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it("returns the winner when two creates hit the unique constraint", async () => {
    const spot = storedSpot();
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(spot);
    create.mockRejectedValueOnce(uniqueViolation());
    const consumeRateLimit = vi.fn(() => true);

    const result = await createSpot(USER_ID, input, { consumeRateLimit });

    expect(result).toEqual({ ok: true, created: false, spot });
    expect(create).toHaveBeenCalledTimes(1);
    expect(consumeRateLimit).toHaveBeenCalledTimes(1);
  });

  it("rethrows a unique violation when this key has no stored spot", async () => {
    const error = uniqueViolation();
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue(error);

    await expect(
      createSpot(USER_ID, input, { consumeRateLimit: () => true }),
    ).rejects.toBe(error);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it("stores the key when the submit is new", async () => {
    const spot = storedSpot();
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(spot);

    const result = await createSpot(USER_ID, input, {
      consumeRateLimit: () => true,
    });

    expect(result).toEqual({ ok: true, created: true, spot });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: USER_ID,
          clientRequestId: REQUEST_ID,
          parking: null,
          parkingNote: null,
          accessibility: null,
          accessibilityNote: null,
        }),
      }),
    );
  });

  it("creates without a key for older clients", async () => {
    const spot = storedSpot();
    create.mockResolvedValue(spot);
    const legacy = {
      name: input.name,
      description: input.description,
      lat: input.lat,
      lng: input.lng,
      acceptedGuidelines: input.acceptedGuidelines,
    };

    const result = await createSpot(USER_ID, legacy, {
      consumeRateLimit: () => true,
    });

    expect(result).toEqual({ ok: true, created: true, spot });
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientRequestId: null }),
      }),
    );
  });

  it("stores parking and accessibility on a new spot", async () => {
    const spot = storedSpot();
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(spot);

    await createSpot(
      USER_ID,
      {
        ...input,
        parking: "paid",
        parkingNote: "חניון",
        accessibility: "partial",
        accessibilityNote: null,
      },
      { consumeRateLimit: () => true },
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parking: "paid",
          parkingNote: "חניון",
          accessibility: "partial",
          accessibilityNote: null,
        }),
      }),
    );
  });

  it("stores the Google display name and publishes the spot", async () => {
    const spot = storedSpot();
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(spot);

    await createSpot(USER_ID, input, {
      displayName: "  דנה כהן  ",
      consumeRateLimit: () => true,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "approved",
          contributorName: "דנה כהן",
          description: input.description,
        }),
      }),
    );
  });
});

describe("createSuggestion", () => {
  const suggestion = {
    name: "מצפה ארבל",
    lat: 32.82,
    lng: 35.5,
    contributorName: "נועה",
    clientRequestId: REQUEST_ID,
  };

  it("inserts a pending row with no owner", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "pending-1", status: "pending" });
    const consumeRateLimit = vi.fn(() => true);

    const result = await createSuggestion(suggestion, { consumeRateLimit });

    expect(result.ok).toBe(true);
    expect(consumeRateLimit).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: suggestion.name,
          createdById: null,
          status: "pending",
          contributorName: "נועה",
          description: "",
        }),
      }),
    );
  });

  it("does not insert or consume a rate limit when the same request already exists", async () => {
    const existing = { id: "pending-1", status: "pending" };
    findFirst.mockResolvedValue(existing);
    const consumeRateLimit = vi.fn(() => true);

    const result = await createSuggestion(suggestion, { consumeRateLimit });

    expect(result).toEqual({ ok: true, created: false, spot: existing });
    expect(create).not.toHaveBeenCalled();
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });

  it("rate-limits a new suggestion", async () => {
    findFirst.mockResolvedValue(null);

    const result = await createSuggestion(suggestion, {
      consumeRateLimit: () => false,
    });

    expect(result).toEqual({ ok: false, reason: "rate_limited" });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("moderateSuggestion", () => {
  it("approves only a pending row", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    findUnique.mockResolvedValue({ id: "pending-1", status: "approved" });

    const spot = await moderateSuggestion("pending-1", "approved");

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "pending-1", status: "pending" },
      data: { status: "approved" },
    });
    expect(spot).toEqual({ id: "pending-1", status: "approved" });
  });

  it("does nothing when the row is not pending", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const spot = await moderateSuggestion("live-1", "rejected");

    expect(spot).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
