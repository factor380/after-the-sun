import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { dictionary } from "@/lib/i18n/dictionaries";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

const session = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock("@/lib/supabase/use-current-user-id", () => ({
  useCurrentUserId: () => session.userId,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children?: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

vi.mock("@/components/spots/AddSpotPhoto", () => ({ default: () => null }));
vi.mock("@/components/spots/ReportSpot", () => ({ default: () => null }));

import SpotContributorTools from "@/components/spots/SpotContributorTools";

const SPOT_ID = "cmwbtra100001jp07yxl3gp4x";
const SPOT_SLUG = "yaar-yatir";
const USER_ID = "00000000-0000-4000-8000-000000000001";

function renderTools(createdById: string | null) {
  return renderToStaticMarkup(
    createElement(
      LocaleProvider,
      null,
      createElement(SpotContributorTools, {
        spotId: SPOT_ID,
        slug: SPOT_SLUG,
        createdById,
        photoCount: 0,
        lat: 31.34,
        lng: 35.05,
        name: "יער יתיר",
      }),
    ),
  );
}

function expectOwnerLinksHidden(html: string) {
  expect(html).not.toContain(dictionary.editSpot);
  expect(html).not.toContain(dictionary.mySpotsTitle);
  expect(html).not.toContain(`/spots/${SPOT_SLUG}/edit`);
  expect(html).not.toContain("/spots/mine");
}

describe("SpotContributorTools owner links", () => {
  it("hides owner links for an anonymous visitor when the spot has no creator", () => {
    session.userId = null;
    expectOwnerLinksHidden(renderTools(null));
  });

  it("hides owner links for a signed-in user when the spot has no creator", () => {
    session.userId = USER_ID;
    expectOwnerLinksHidden(renderTools(null));
  });

  it("shows owner links when the signed-in user created the spot", () => {
    session.userId = USER_ID;
    const html = renderTools(USER_ID);
    expect(html).toContain(dictionary.editSpot);
    expect(html).toContain(dictionary.mySpotsTitle);
    expect(html).toContain(`/spots/${SPOT_SLUG}/edit`);
    expect(html).toContain("/spots/mine");
  });

  it("hides owner links when a different user is signed in", () => {
    session.userId = "00000000-0000-4000-8000-000000000002";
    expectOwnerLinksHidden(renderTools(USER_ID));
  });
});
