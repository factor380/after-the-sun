"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  GOOGLE_IDENTITY_LOAD_TIMEOUT_MS,
  GOOGLE_IDENTITY_SCRIPT_URL,
  createGoogleNoncePair,
  googleIdentityApi,
  googleSignInCompleteUrl,
  rawNonceForSupabase,
  readGoogleClientId,
  supabaseOAuthCallbackUrl,
  type GoogleNoncePair,
} from "@/lib/google-identity";
import { createClient } from "@/lib/supabase/client";
import { useTheme, type Theme } from "@/lib/theme/ThemeProvider";

type SignInPhase = "loading" | "ready" | "fallback";

type GoogleSignInButtonProps = {
  nextPath: string;
  supabaseConfigured: boolean;
  onAttempt: () => void;
  onError: (key: MessageKey) => void;
};

/**
 * Google's `initialize` is once per page load. React Strict Mode remounts the
 * button, so the nonce and the GIS callback live on the module, and the
 * mounted button receives the credential through this handler.
 */
let identitySession: Promise<GoogleNoncePair> | null = null;
let onCredential: ((credential: string | undefined) => void) | null = null;

function ensureGoogleIdentity(clientId: string): Promise<GoogleNoncePair> {
  if (!identitySession) {
    identitySession = createGoogleIdentitySession(clientId).catch((error: unknown) => {
      identitySession = null;
      throw error;
    });
  }
  return identitySession;
}

async function createGoogleIdentitySession(clientId: string): Promise<GoogleNoncePair> {
  const api = googleIdentityApi();
  if (!api) throw new Error("Google Identity Services is unavailable");
  const nonce = await createGoogleNoncePair();
  api.initialize({
    client_id: clientId,
    nonce: nonce.hashedNonce,
    callback: (response) => {
      onCredential?.(response.credential);
    },
    auto_select: false,
    context: "signin",
    ux_mode: "popup",
    itp_support: true,
    use_fedcm_for_prompt: true,
  });
  return nonce;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function OAuthFallbackButton({
  disabled,
  pending,
  onClick,
}: {
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={disabled || pending}
      className="flex w-full items-center justify-center gap-3 border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 font-medium text-[var(--sand)] transition hover:border-[var(--ember)] hover:brightness-110 disabled:opacity-60"
    >
      <GoogleIcon />
      {pending ? t("signingInWithGoogle") : t("signInWithGoogle")}
    </button>
  );
}

export default function GoogleSignInButton({
  nextPath,
  supabaseConfigured,
  onAttempt,
  onError,
}: GoogleSignInButtonProps) {
  const clientId = readGoogleClientId();
  const { t } = useLocale();
  const { theme } = useTheme();
  const [phase, setPhase] = useState<SignInPhase>(clientId ? "loading" : "fallback");
  const [oauthPending, setOauthPending] = useState(false);
  const [idTokenPending, setIdTokenPending] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const painted = useRef<{ width: number; theme: Theme } | null>(null);
  const nextPathRef = useRef(nextPath);
  const configuredRef = useRef(supabaseConfigured);
  const onAttemptRef = useRef(onAttempt);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    nextPathRef.current = nextPath;
    configuredRef.current = supabaseConfigured;
    onAttemptRef.current = onAttempt;
    onErrorRef.current = onError;
  }, [nextPath, supabaseConfigured, onAttempt, onError]);

  const completeIdTokenSignIn = useCallback(async (credential: string | undefined) => {
    onAttemptRef.current();
    if (!credential) {
      onErrorRef.current("googleSignInFailed");
      return;
    }
    if (!configuredRef.current) {
      onErrorRef.current("supabaseNotConfigured");
      return;
    }
    setIdTokenPending(true);
    try {
      const nonce = identitySession ? await identitySession : null;
      if (!nonce) throw new Error("missing nonce");
      const supabase = createClient();
      const rawNonce = rawNonceForSupabase(credential, nonce.rawNonce);
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
        ...(rawNonce ? { nonce: rawNonce } : {}),
      });
      if (error) throw error;
      // Full navigation so the next server render sees the new session cookies.
      // NEXT_PUBLIC_SITE_URL would send a local login to the live site.
      window.location.assign(
        googleSignInCompleteUrl(window.location.origin, nextPathRef.current),
      );
    } catch {
      setIdTokenPending(false);
      onErrorRef.current("googleSignInFailed");
    }
  }, []);

  useEffect(() => {
    onCredential = (credential) => {
      void completeIdTokenSignIn(credential);
    };
    return () => {
      onCredential = null;
    };
  }, [completeIdTokenSignIn]);

  useEffect(() => {
    if (!clientId || phase !== "loading") return;
    const timer = window.setTimeout(() => {
      setPhase((current) => (current === "loading" ? "fallback" : current));
    }, GOOGLE_IDENTITY_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [clientId, phase]);

  useEffect(() => {
    if (phase !== "ready") return;
    const frame = frameRef.current;
    if (!frame) return;

    const paint = () => {
      const api = googleIdentityApi();
      const host = hostRef.current;
      if (!api || !host) return;
      const available = Math.floor(frame.clientWidth);
      if (available < 200) return;
      const width = Math.min(400, available);
      if (
        painted.current?.width === width &&
        painted.current.theme === theme &&
        host.childElementCount > 0
      ) {
        return;
      }
      painted.current = { width, theme };
      host.replaceChildren();
      api.renderButton(host, {
        type: "standard",
        theme: theme === "dark" ? "filled_black" : "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "center",
        width,
      });
    };

    paint();
    const observer = new ResizeObserver(() => paint());
    observer.observe(frame);
    return () => observer.disconnect();
  }, [phase, theme]);

  async function onScriptReady() {
    if (!clientId) {
      setPhase("fallback");
      return;
    }
    try {
      await ensureGoogleIdentity(clientId);
      setPhase("ready");
    } catch {
      setPhase((current) => (current === "ready" ? current : "fallback"));
    }
  }

  async function signInWithOAuth() {
    onAttempt();
    if (!supabaseConfigured) {
      onError("supabaseNotConfigured");
      return;
    }
    setOauthPending(true);
    try {
      const supabase = createClient();
      // Always return to the origin the user started on (localhost vs production).
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: supabaseOAuthCallbackUrl(window.location.origin, nextPath),
        },
      });
      if (error) throw error;
    } catch {
      onError("googleSignInFailed");
      setOauthPending(false);
    }
  }

  return (
    <>
      {clientId ? (
        <Script
          id="google-identity-services"
          src={GOOGLE_IDENTITY_SCRIPT_URL}
          strategy="afterInteractive"
          onReady={() => {
            void onScriptReady();
          }}
          onError={() => {
            setPhase((current) => (current === "ready" ? current : "fallback"));
          }}
        />
      ) : null}
      {phase === "ready" ? (
        <div
          ref={frameRef}
          dir="ltr"
          aria-busy={idTokenPending}
          className="flex min-h-10 w-full justify-center"
        >
          <div
            ref={hostRef}
            className={idTokenPending ? "pointer-events-none opacity-60" : undefined}
          />
        </div>
      ) : (
        <OAuthFallbackButton
          disabled={phase === "loading"}
          pending={oauthPending}
          onClick={() => {
            void signInWithOAuth();
          }}
        />
      )}
      {idTokenPending ? (
        <p className="text-center text-sm text-[var(--sand-muted)]" role="status">
          {t("signingInWithGoogle")}
        </p>
      ) : null}
    </>
  );
}
