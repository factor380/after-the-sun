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
  const [elevated, setElevated] = useState(false);

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

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const onScroll = () => setElevated(main.scrollTop > 8);
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <header
      className={`z-40 shrink-0 border-b border-[var(--line)] bg-[var(--dusk-deep)]/95 px-4 py-3 backdrop-blur-md transition-shadow md:px-8 ${
        elevated ? "shadow-[0_10px_28px_rgb(22_16_24/0.16)]" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link
          href="/"
          className="group shrink-0 transition-opacity hover:opacity-90"
          aria-label={t("brand")}
        >
        <BrandLogo
          title={t("brand")}
          markClassName="size-7 md:size-8"
          titleClassName="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--sand)] md:text-xl"
        />
        </Link>

        <nav className="flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm md:w-auto md:flex-nowrap md:gap-4">
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
      </div>
    </header>
  );
}
