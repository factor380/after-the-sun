"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!configured);

  useEffect(() => {
    if (!configured) return;

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
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[6.75rem] flex-wrap content-center items-center justify-between gap-y-1 bg-gradient-to-b from-[var(--dusk-deep)]/95 via-[var(--dusk-deep)]/80 to-transparent px-4 md:h-20 md:flex-nowrap md:px-8">
      <Link
        href="/"
        className="pointer-events-auto group transition-opacity hover:opacity-90"
        aria-label={t("brand")}
      >
        <BrandLogo
          title={t("brand")}
          markClassName="size-7 md:size-8"
          titleClassName="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--sand)] md:text-xl"
        />
      </Link>

      <nav className="pointer-events-auto flex w-full items-center justify-end gap-2 text-sm md:w-auto md:gap-4">
        <ThemeToggle />
        {authReady && configured && email ? (
          <Link
            href="/spots/mine"
            className="text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
          >
            {t("mySpotsNav")}
          </Link>
        ) : null}
        <Link
          href="/about"
          aria-current={pathname === "/about" ? "page" : undefined}
          className={`transition hover:text-[var(--sand)] ${
            pathname === "/about"
              ? "text-[var(--sand)]"
              : "text-[var(--sand-muted)]"
          }`}
        >
          {t("campaignNav")}
        </Link>
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
