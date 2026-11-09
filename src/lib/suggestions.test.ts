import { describe, expect, it } from "vitest";
import { cleanContributorName } from "@/lib/contributor-name";
import { isSuggestionHoneypot } from "@/lib/suggestions";

describe("isSuggestionHoneypot", () => {
  it("ignores an empty or missing field", () => {
    expect(isSuggestionHoneypot({})).toBe(false);
    expect(isSuggestionHoneypot({ website: "" })).toBe(false);
    expect(isSuggestionHoneypot({ website: "   " })).toBe(false);
    expect(isSuggestionHoneypot(null)).toBe(false);
  });

  it("trips when the hidden field has text", () => {
    expect(isSuggestionHoneypot({ website: "https://spam.example" })).toBe(true);
  });
});

describe("cleanContributorName", () => {
  it("trims, collapses spaces, and drops control characters", () => {
    expect(cleanContributorName("  דנה\nכהן  ")).toBe("דנה כהן");
    expect(cleanContributorName("")).toBeNull();
    expect(cleanContributorName(null)).toBeNull();
  });

  it("caps the name at 80 characters", () => {
    expect(cleanContributorName("א".repeat(90))?.length).toBe(80);
  });
});
