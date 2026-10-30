import { describe, expect, it } from "vitest";
import { canOptimizeSpotPhoto, spotCoverUrl } from "@/lib/spot-cover";

const SUPABASE =
  "https://qsodkvxcedctfrgqmuch.supabase.co/storage/v1/object/public/spot-photos/a/b.jpg";

describe("spot cover photos", () => {
  it("uses the spot photo, then the first community photo, and drops anything else", () => {
    expect(spotCoverUrl({ photoUrl: SUPABASE, photos: [{ url: "https://example.com/other.jpg" }] })).toBe(
      SUPABASE,
    );
    expect(spotCoverUrl({ photoUrl: null, photos: [{ url: SUPABASE }] })).toBe(SUPABASE);
    expect(spotCoverUrl({ photoUrl: null, photos: [] })).toBeNull();
    expect(spotCoverUrl({ photoUrl: "http://example.com/a.jpg" })).toBeNull();
    expect(spotCoverUrl({ photoUrl: "javascript:alert(1)" })).toBeNull();
  });

  it("optimizes only public Supabase spot photos", () => {
    expect(canOptimizeSpotPhoto(SUPABASE)).toBe(true);
    expect(canOptimizeSpotPhoto("https://example.com/sunset.jpg")).toBe(false);
    expect(canOptimizeSpotPhoto(`${SUPABASE}?x=1`)).toBe(false);
    expect(canOptimizeSpotPhoto("https://evil.supabase.co.example/storage/v1/object/public/spot-photos/a.jpg")).toBe(
      false,
    );
  });
});
