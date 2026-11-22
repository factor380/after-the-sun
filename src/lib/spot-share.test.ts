import { afterEach, describe, expect, it, vi } from "vitest";
import { dictionary } from "@/lib/i18n/dictionaries";
import { SITE_NAME } from "@/lib/seo";
import {
  buildSpotShare,
  isCanonicalSpotUrl,
  whatsAppShareHref,
  type SpotSharePayload,
} from "@/lib/spot-share";
import { shareOrCopySpot, safeWhatsAppHref } from "@/lib/spot-share-action";

const SPOT = { slug: "e2e-tel-aviv", name: "נמל יפו" };

describe("buildSpotShare", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the spot name, Hebrew line, and canonical URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    const share = buildSpotShare(SPOT);

    expect(share).toEqual({
      title: "נמל יפו",
      text: "נקודת שקיעה: נמל יפו | After the Sun",
      url: "https://after-the-sun.com/spots/e2e-tel-aviv",
    });
    expect(share?.text).toBe(`${dictionary.shareSpotLead}: נמל יפו | ${SITE_NAME}`);
    expect(share?.url).not.toContain("utm_");
    expect(new URL(share?.url ?? "").search).toBe("");
  });

  it("ignores a localhost site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3004");

    expect(buildSpotShare({ slug: "ckspot1", name: "צוק" })?.url).toBe(
      "https://after-the-sun.com/spots/ckspot1",
    );
  });

  it("uses the configured public origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.com/");

    expect(buildSpotShare({ slug: "ckspot1", name: "צוק" })?.url).toBe(
      "https://staging.example.com/spots/ckspot1",
    );
  });

  it("collapses whitespace and keeps a dollar sign in the name literal", () => {
    const share = buildSpotShare({ slug: "ckspot1", name: "  צוק\n$&  " });

    expect(share?.title).toBe("צוק $&");
    expect(share?.text).toBe("נקודת שקיעה: צוק $& | After the Sun");
  });

  it("returns null for an id or name that cannot be a public spot URL", () => {
    expect(buildSpotShare({ slug: "../admin", name: "צוק" })).toBeNull();
    expect(buildSpotShare({ slug: "a/b", name: "צוק" })).toBeNull();
    expect(buildSpotShare({ slug: "a b", name: "צוק" })).toBeNull();
    expect(buildSpotShare({ slug: "a?b", name: "צוק" })).toBeNull();
    expect(buildSpotShare({ slug: ".", name: "צוק" })).toBeNull();
    expect(buildSpotShare({ slug: "", name: "צוק" })).toBeNull();
    expect(buildSpotShare({ slug: "ckspot1", name: "  \n  " })).toBeNull();
  });
});

describe("whatsAppShareHref", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("puts the Hebrew line and the canonical URL in the wa.me text", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const share = buildSpotShare(SPOT);
    if (!share) throw new Error("expected a share payload");

    const href = whatsAppShareHref(share);
    const parsed = new URL(href);

    expect(`${parsed.origin}${parsed.pathname}`).toBe("https://wa.me/");
    expect(parsed.searchParams.get("text")).toBe(`${share.text}\n${share.url}`);
    expect(safeWhatsAppHref(href)).toBe(href);
  });

  it("refuses a URL that is not this site's spot page", () => {
    const forged = {
      title: "צוק",
      text: "נקודת שקיעה: צוק | After the Sun",
      url: "https://evil.example/spots/ckspot1",
    } satisfies SpotSharePayload;

    expect(isCanonicalSpotUrl(forged.url)).toBe(false);
    expect(() => whatsAppShareHref(forged)).toThrow(/canonical spot URL/);
    expect(safeWhatsAppHref("javascript:alert(1)")).toBeNull();
    expect(safeWhatsAppHref("https://wa.me.evil.example/?text=hi")).toBeNull();
  });
});

describe("shareOrCopySpot", () => {
  const payload: SpotSharePayload = {
    title: "נמל יפו",
    text: "נקודת שקיעה: נמל יפו | After the Sun",
    url: "https://after-the-sun.com/spots/e2e-tel-aviv",
  };

  it("shares the title, text, and URL when the share sheet exists", async () => {
    let received: SpotSharePayload | null = null;

    const result = await shareOrCopySpot(payload, {
      share: async (data) => {
        received = data;
      },
    });

    expect(result).toBe("shared");
    expect(received).toEqual(payload);
  });

  it("ignores AbortError and does not copy the link", async () => {
    const abort = new Error("Share canceled");
    abort.name = "AbortError";
    let copied = false;

    const result = await shareOrCopySpot(payload, {
      share: async () => {
        throw abort;
      },
      clipboard: {
        writeText: async () => {
          copied = true;
        },
      },
    });

    expect(result).toBe("cancelled");
    expect(copied).toBe(false);
  });

  it("copies the canonical URL when share is missing or canShare is false", async () => {
    const written: string[] = [];
    const clipboard = {
      writeText: async (value: string) => {
        written.push(value);
      },
    };

    await expect(shareOrCopySpot(payload, { clipboard })).resolves.toBe("copied");
    await expect(
      shareOrCopySpot(payload, {
        share: async () => {
          throw new Error("should not be called");
        },
        canShare: () => false,
        clipboard,
      }),
    ).resolves.toBe("copied");

    expect(written).toEqual([payload.url, payload.url]);
  });

  it("does not copy when the share sheet fails for another reason", async () => {
    let copied = false;

    await expect(
      shareOrCopySpot(payload, {
        share: async () => {
          throw new Error("share failed");
        },
        clipboard: {
          writeText: async () => {
            copied = true;
          },
        },
      }),
    ).rejects.toThrow("share failed");
    expect(copied).toBe(false);
  });
});
