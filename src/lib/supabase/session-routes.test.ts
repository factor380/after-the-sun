import { describe, expect, it } from "vitest";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/revalidate-public";
import { routeRefreshesAuthSession } from "@/lib/supabase/session-routes";

describe("routeRefreshesAuthSession", () => {
  it("refreshes only routes that read the signed-in user", () => {
    expect(PUBLIC_PAGE_REVALIDATE_SECONDS).toBe(600);

    for (const path of [
      "/",
      "/about",
      "/regions/tel-aviv",
      "/regions/judea-samaria",
      "/spots/cmrw0xspi0000v3w0xcs3qn42",
      "/opengraph-image",
      "/about/opengraph-image",
      "/llms.txt",
    ]) {
      expect(routeRefreshesAuthSession(path), path).toBe(false);
    }

    for (const path of [
      "/login",
      "/login/",
      "/auth/callback",
      "/api/spots",
      "/api/spots/abc",
      "/spots/new",
      "/spots/mine",
      "/spots/abc/edit",
      "/spots/abc/edit/",
    ]) {
      expect(routeRefreshesAuthSession(path), path).toBe(true);
    }

    expect(routeRefreshesAuthSession("/spots/newest")).toBe(false);
    expect(routeRefreshesAuthSession("/spots/minefield")).toBe(false);
  });
});
