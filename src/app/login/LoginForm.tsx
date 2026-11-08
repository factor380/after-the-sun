"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = safeRedirectPath(searchParams.get("next"));
  const { t } = useLocale();
  const callbackError =
    searchParams.get("error") === "auth" ? t("authCallbackFailed") : null;
  const [formError, setFormError] = useState<string | null>(null);
  const [hideCallbackError, setHideCallbackError] = useState(false);
  const error = formError ?? (hideCallbackError ? null : callbackError);
  const configured = isSupabaseConfigured();

  function reportSignInError(key: MessageKey) {
    setHideCallbackError(true);
    setFormError(t(key));
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        {t("signInTitle")}
      </h1>
      <p className="mt-2 text-[var(--sand-muted)]">{t("signInSubtitle")}</p>

      <div className="mt-8 space-y-4">
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <GoogleSignInButton
          nextPath={nextPath}
          supabaseConfigured={configured}
          onAttempt={() => {
            setHideCallbackError(true);
            setFormError(null);
          }}
          onError={reportSignInError}
        />
      </div>
    </div>
  );
}
