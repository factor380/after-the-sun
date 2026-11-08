import { describe, expect, it } from "vitest";
import {
  createGoogleNoncePair,
  googleIdTokenNonce,
  googleSignInCompleteUrl,
  postGoogleSignInRedirect,
  rawNonceForSupabase,
  readGoogleClientId,
  supabaseOAuthCallbackUrl,
} from "@/lib/google-identity";

const ORIGIN = "https://after-the-sun.com";
const CLIENT_ID = "123456789012-abcDEF_123.apps.googleusercontent.com";

function fakeIdToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${body}.signature`;
}

describe("readGoogleClientId", () => {
  it("accepts a web client id and ignores everything else", () => {
    expect(readGoogleClientId(undefined)).toBeNull();
    expect(readGoogleClientId(null)).toBeNull();
    expect(readGoogleClientId("")).toBeNull();
    expect(readGoogleClientId("  ")).toBeNull();
    expect(readGoogleClientId(`  ${CLIENT_ID}  `)).toBe(CLIENT_ID);
    expect(readGoogleClientId("not-a-client-id")).toBeNull();
    expect(readGoogleClientId(`${CLIENT_ID}" onload="alert(1)`)).toBeNull();
    expect(readGoogleClientId("https://evil.example/client")).toBeNull();
  });
});

describe("createGoogleNoncePair", () => {
  it("gives Google the sha-256 hex of the raw nonce", async () => {
    const first = await createGoogleNoncePair();
    const second = await createGoogleNoncePair();

    expect(first.rawNonce).toMatch(/^[0-9a-f]{64}$/);
    expect(first.hashedNonce).toMatch(/^[0-9a-f]{64}$/);
    expect(first.hashedNonce).not.toBe(first.rawNonce);
    expect(second.rawNonce).not.toBe(first.rawNonce);

    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(first.rawNonce),
    );
    const hex = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    expect(first.hashedNonce).toBe(hex);
  });
});

describe("rawNonceForSupabase", () => {
  it("sends the raw nonce only when the token carries a nonce claim", () => {
    const withNonce = fakeIdToken({ nonce: "abc", email: "a@example.com" });
    const withoutNonce = fakeIdToken({ email: "a@example.com" });

    expect(googleIdTokenNonce(withNonce)).toBe("abc");
    expect(googleIdTokenNonce(withoutNonce)).toBeNull();
    expect(googleIdTokenNonce("not-a-jwt")).toBeNull();
    expect(googleIdTokenNonce("")).toBeNull();
    expect(rawNonceForSupabase(withNonce, "raw-value")).toBe("raw-value");
    expect(rawNonceForSupabase(withoutNonce, "raw-value")).toBeUndefined();
  });
});

describe("post sign-in redirects", () => {
  it("returns to the same page and drops open redirects", () => {
    expect(googleSignInCompleteUrl(ORIGIN, "/spots/new")).toBe(
      `${ORIGIN}/auth/complete?next=%2Fspots%2Fnew`,
    );
    expect(googleSignInCompleteUrl(ORIGIN, "/")).toBe(`${ORIGIN}/auth/complete`);
    expect(googleSignInCompleteUrl(ORIGIN, "https://evil.example")).toBe(
      `${ORIGIN}/auth/complete`,
    );

    expect(supabaseOAuthCallbackUrl(ORIGIN, "/spots/abc/edit")).toBe(
      `${ORIGIN}/auth/callback?next=%2Fspots%2Fabc%2Fedit`,
    );
    expect(supabaseOAuthCallbackUrl("http://localhost:3004", "//evil.example")).toBe(
      "http://localhost:3004/auth/callback?next=%2F",
    );

    expect(postGoogleSignInRedirect(ORIGIN, "/spots/new", true)).toBe(
      `${ORIGIN}/spots/new`,
    );
    expect(postGoogleSignInRedirect(ORIGIN, "/spots/new", false)).toBe(
      `${ORIGIN}/login?error=auth&next=%2Fspots%2Fnew`,
    );
    expect(postGoogleSignInRedirect(ORIGIN, "https://evil.example", true)).toBe(
      `${ORIGIN}/`,
    );
    expect(postGoogleSignInRedirect(ORIGIN, null, false)).toBe(
      `${ORIGIN}/login?error=auth`,
    );
  });
});
