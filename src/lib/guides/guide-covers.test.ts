import { beforeEach, describe, expect, it, vi } from "vitest";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

vi.mock("@/services/spots", () => ({
  listSpots: vi.fn(),
}));

import { loadGuideCoverMap } from "@/lib/guides/guide-covers";
import { listSpots } from "@/services/spots";

const PHOTO = "https://cdn.example.com/sunset.jpg";

beforeEach(() => {
  vi.mocked(listSpots).mockReset();
  vi.unstubAllEnvs();
});

describe("loadGuideCoverMap", () => {
  it("maps each spot id to its https cover", async () => {
    vi.mocked(listSpots).mockResolvedValue([
      {
        id: "spot-1",
        photoUrl: PHOTO,
        photos: [],
      },
      {
        id: "spot-2",
        photoUrl: null,
        photos: [],
      },
    ] as unknown as Awaited<ReturnType<typeof listSpots>>);

    const covers = await loadGuideCoverMap();

    expect(covers.get("spot-1")).toBe(PHOTO);
    expect(covers.has("spot-2")).toBe(false);
  });

  it("renders without photos when the database is unavailable at build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    vi.mocked(listSpots).mockRejectedValue(new Error("database unavailable"));

    await expect(loadGuideCoverMap()).resolves.toEqual(new Map());
  });

  it("does not replace a cached guide when the database fails in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    vi.mocked(listSpots).mockRejectedValue(new Error("database unavailable"));

    await expect(loadGuideCoverMap()).rejects.toThrow("database unavailable");
  });
});
