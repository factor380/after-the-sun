"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setAuthReady(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-16 shrink-0 items-center justify-between bg-gradient-to-b from-[var(--dusk-deep)]/90 to-transparent px-5 md:px-8">
      <Link
        href="/"
        className="pointer-events-auto group transition-opacity hover:opacity-90"
        aria-label={t("brand")}
      >
        <BrandLogo
          title={t("brand")}
          titleClassName="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--sand)] md:text-2xl"
        />
      </Link>

      <nav className="pointer-events-auto flex items-center gap-3 text-sm md:gap-4">
        {authReady && configured && email ? (
          <Link
            href="/spots/mine"
            className="text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
          >
            {t("mySpotsNav")}
          </Link>
        ) : null}
        <Link
          href="/spots/new"
          className="bg-[var(--ember)] px-3.5 py-2 font-medium text-white transition hover:brightness-110"
        >
          {t("addSpot")}
        </Link>
        {authReady && configured ? (
          email ? (
            <button
              type="button"
              onClick={signOut}
              className="text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
            >
              {t("signOut")}
            </button>
          ) : (
            <Link
              href="/login"
              className="text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
            >
              {t("signIn")}
            </Link>
          )
        ) : null}
      </nav>
    </header>
  );
}
