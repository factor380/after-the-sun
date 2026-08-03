"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { safeRedirectPath } from "@/lib/safe-redirect";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = safeRedirectPath(searchParams.get("next"));
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!configured) {
      setError(t("supabaseNotConfigured"));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("magicLinkFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        {t("signInTitle")}
      </h1>
      <p className="mt-2 text-[var(--sand-muted)]">{t("signInSubtitle")}</p>

      {sent ? (
        <p className="mt-8 border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--sand)]">
          {t("checkInbox")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--sand-muted)]">
              {t("email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
              placeholder="you@example.com"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--ember)] px-5 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? t("sending") : t("sendMagicLink")}
          </button>
        </form>
      )}
    </div>
  );
}
