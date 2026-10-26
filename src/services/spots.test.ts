import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { upsert, findUnique, create } = vi.hoisted(() => ({
  upsert: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { upsert },
    spot: { findUnique, create },
  },
}));

import { createSpot } from "@/services/spots";

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
  create.mockReset();
  upsert.mockResolvedValue({ id: USER_ID });
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
});
