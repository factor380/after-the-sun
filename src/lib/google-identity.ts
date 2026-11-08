import {
  GOOGLE_IDENTITY_GSI_PREFIX,
  GOOGLE_IDENTITY_SCRIPT_SRC,
  GOOGLE_IDENTITY_STYLE_SRC,
} from "@/lib/content-security-policy";
import { safeRedirectPath } from "@/lib/safe-redirect";

export {
  GOOGLE_IDENTITY_GSI_PREFIX,
  GOOGLE_IDENTITY_SCRIPT_SRC,
  GOOGLE_IDENTITY_STYLE_SRC,
};

/**
 * Google Identity Services runs on our origin, so the account chooser says
 * "Continue to after-the-sun.com". The ID token is then exchanged with
 * Supabase (`signInWithIdToken`). Supabase hashes the raw nonce with SHA-256
 * and compares that digest to the nonce claim, so Google receives the digest
 * and Supabase receives the raw value.
 */

const GOOGLE_CLIENT_ID_PATTERN =
  /^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/;

/** Hebrew UI. The query is not part of the CSP source. */
export const GOOGLE_IDENTITY_SCRIPT_URL = `${GOOGLE_IDENTITY_SCRIPT_SRC}?hl=he`;

export const GOOGLE_IDENTITY_LOAD_TIMEOUT_MS = 8000;

const MAX_ID_TOKEN_LENGTH = 8192;

export type GoogleNoncePair = {
  rawNonce: string;
  hashedNonce: string;
};

export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleIdentityApi = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce?: string;
    auto_select?: boolean;
    context?: "signin" | "signup" | "use";
    ux_mode?: "popup" | "redirect";
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    },
  ) => void;
};

type GoogleWindow = Window & {
  google?: { accounts?: { id?: GoogleIdentityApi } };
};

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

/** Public web client id, or null when unset or not a Google web client id. */
export function readGoogleClientId(
  value: string | null | undefined = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!GOOGLE_CLIENT_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export async function createGoogleNoncePair(): Promise<GoogleNoncePair> {
  const rawBytes = crypto.getRandomValues(new Uint8Array(32));
  const rawNonce = hex(rawBytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawNonce),
  );
  return { rawNonce, hashedNonce: hex(new Uint8Array(digest)) };
}

function decodeJwtPayload(idToken: string): unknown {
  if (idToken.length === 0 || idToken.length > MAX_ID_TOKEN_LENGTH) return null;
  const segment = idToken.split(".")[1];
  if (!segment || segment.length > 6000) return null;
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

/**
 * Nonce claim from the ID token payload.
 * Supabase verifies the signature; this only decides whether to send a nonce.
 */
export function googleIdTokenNonce(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);
  if (!payload || typeof payload !== "object") return null;
  const nonce = (payload as { nonce?: unknown }).nonce;
  return typeof nonce === "string" && nonce.length > 0 ? nonce : null;
}

/**
 * Supabase rejects the call when a nonce is passed but the token has none,
 * and the other way around. Omit it only when the signed payload has no claim.
 */
export function rawNonceForSupabase(
  idToken: string,
  rawNonce: string,
): string | undefined {
  return googleIdTokenNonce(idToken) ? rawNonce : undefined;
}

export function googleIdentityApi(): GoogleIdentityApi | null {
  if (typeof window === "undefined") return null;
  const api = (window as GoogleWindow).google?.accounts?.id;
  if (
    !api ||
    typeof api.initialize !== "function" ||
    typeof api.renderButton !== "function"
  ) {
    return null;
  }
  return api;
}

/** OAuth fallback. The browser returns to the origin the user started on. */
export function supabaseOAuthCallbackUrl(origin: string, nextPath: string): string {
  const next = safeRedirectPath(nextPath);
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** After a Google ID token is accepted, the server creates the profile and continues. */
export function googleSignInCompleteUrl(origin: string, nextPath: string): string {
  const next = safeRedirectPath(nextPath);
  const url = new URL("/auth/complete", origin);
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}

export function postGoogleSignInRedirect(
  origin: string,
  next: string | null | undefined,
  signedIn: boolean,
): string {
  const path = safeRedirectPath(next);
  if (!signedIn) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", "auth");
    if (path !== "/") login.searchParams.set("next", path);
    return login.toString();
  }
  return new URL(path, origin).toString();
}
