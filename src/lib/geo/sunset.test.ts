import { describe, expect, it } from "vitest";
import { sunsetTime } from "./sunset";

const TEL_AVIV = { lat: 32.0853, lng: 34.7818 };

function at(iso: string): Date {
  return new Date(iso);
}

describe("sunsetTime", () => {
  it("returns the Jerusalem clock time for a Tel Aviv summer day", () => {
    expect(
      sunsetTime(TEL_AVIV.lat, TEL_AVIV.lng, at("2026-06-21T09:00:00Z")),
    ).toBe("19:51");
  });

  it("returns an earlier clock time in winter", () => {
    expect(
      sunsetTime(TEL_AVIV.lat, TEL_AVIV.lng, at("2026-12-21T10:00:00Z")),
    ).toBe("16:41");
  });

  it("uses the Asia/Jerusalem civil date, not the UTC date", () => {
    // Both instants fall on 15 Jan UTC. 22:30Z is already 16 Jan in Jerusalem.
    expect(
      sunsetTime(TEL_AVIV.lat, TEL_AVIV.lng, at("2026-01-15T21:30:00Z")),
    ).toBe("16:59");
    expect(
      sunsetTime(TEL_AVIV.lat, TEL_AVIV.lng, at("2026-01-15T22:30:00Z")),
    ).toBe("17:00");
  });

  it("is earlier further east inside the same timezone", () => {
    const date = at("2026-06-21T09:00:00Z");
    expect(sunsetTime(32, 34.8, date)).toBe("19:51");
    expect(sunsetTime(32, 35.5, date)).toBe("19:48");
  });

  it("shares one result for coordinates in the same hundredth of a degree", () => {
    const date = at("2026-06-21T09:00:00Z");
    expect(sunsetTime(32.081, 34.781, date)).toBe(
      sunsetTime(32.084, 34.784, date),
    );
  });

  it("returns null when the sun does not set", () => {
    expect(sunsetTime(89, 0, at("2026-06-21T09:00:00Z"))).toBeNull();
  });

  it("returns null for coordinates outside the valid range", () => {
    const date = at("2026-06-21T09:00:00Z");
    expect(sunsetTime(91, 34, date)).toBeNull();
    expect(sunsetTime(32, 181, date)).toBeNull();
    expect(sunsetTime(Number.NaN, 34, date)).toBeNull();
  });
});
