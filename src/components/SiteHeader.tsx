"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useEffect, useId, useRef, useState } from "react";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!configured);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setEmail(data.user?.email ?? null);
        setAuthReady(true);
      })
      .catch(() => {
        setAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  function closeMenu() {
    setMenuPath(null);
  }

  function toggleMenu() {
    setMenuPath((current) => (current === pathname ? null : pathname));
  }

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuPath(null);
      menuButtonRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuPath(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  async function signOut() {
    closeMenu();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  function navLinks(variant: "row" | "stack") {
    const item =
      variant === "row"
        ? "text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
        : "border-b border-[var(--line)] py-3 text-start text-[var(--sand-muted)] transition last:border-b-0 hover:text-[var(--sand)]";
    const active = "text-[var(--sand)]";

    return (
      <>
        {authReady && configured && email ? (
          <Link
            href="/spots/mine"
            aria-current={pathname === "/spots/mine" ? "page" : undefined}
            className={`${item} ${pathname === "/spots/mine" ? active : ""}`}
          >
            {t("mySpotsNav")}
          </Link>
        ) : null}
        <Link
          href="/about"
          aria-current={pathname === "/about" ? "page" : undefined}
          className={`${item} ${pathname === "/about" ? active : ""}`}
        >
          {t("campaignNav")}
        </Link>
        {authReady && configured ? (
          email ? (
            <button
              type="button"
              onClick={signOut}
              className={`${item} ${variant === "stack" ? "w-full" : ""}`}
            >
              {t("signOut")}
            </button>
          ) : (
            <Link
              href="/login"
              aria-current={pathname === "/login" ? "page" : undefined}
              className={`${item} ${pathname === "/login" ? active : ""}`}
            >
              {t("signIn")}
            </Link>
          )
        ) : null}
      </>
    );
  }

  return (
    <header className="relative z-40 shrink-0 border-b border-[var(--line)] bg-[var(--dusk-deep)] text-[var(--sand)] shadow-[0_10px_28px_rgb(42_18_16/0.08)]">
      <div className="flex h-14 items-center justify-between gap-2 px-3 md:h-16 md:gap-4 md:px-8">
        <Link
          href="/"
          className="min-w-0 shrink transition-opacity hover:opacity-90"
          aria-label={t("brand")}
        >
          <BrandLogo
            title={t("brand")}
            markClassName="size-6 md:size-8"
            titleClassName="font-[family-name:var(--font-display)] text-base tracking-tight text-[var(--sand)] md:text-xl"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-1 md:gap-4">
          <ThemeToggle />
          <nav
            aria-label={t("navMenu")}
            className="hidden items-center gap-4 text-sm md:flex"
          >
            {navLinks("row")}
          </nav>
          <Link
            href="/spots/new"
            aria-current={pathname === "/spots/new" ? "page" : undefined}
            className="whitespace-nowrap bg-[var(--ember)] px-2.5 py-1.5 text-[13px] font-medium text-white transition hover:brightness-110 md:px-3.5 md:py-2 md:text-sm"
          >
            {t("addSpot")}
          </Link>
          <div ref={menuRef} className="contents md:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              className="flex size-9 items-center justify-center text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? t("navMenuClose") : t("navMenu")}
              onClick={toggleMenu}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <nav
              id={menuId}
              aria-label={t("navMenu")}
              hidden={!menuOpen}
              className="absolute inset-x-0 top-full z-50 border-b border-[var(--line)] bg-[var(--dusk-deep)] px-4 shadow-[0_16px_40px_rgb(42_18_16/0.14)]"
            >
              <div className="flex flex-col text-sm">{navLinks("stack")}</div>
            </nav>
          </div>
        </div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-[var(--ember)]/75 to-transparent"
      />
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
