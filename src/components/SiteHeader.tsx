"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
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
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-8">
      <Link href="/" className="group">
        <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--sand)] md:text-3xl">
          After the Sun
        </span>
      </Link>

      <nav className="flex items-center gap-3 text-sm md:gap-4">
        <Link
          href="/spots/new"
          className="bg-[var(--ember)] px-3 py-1.5 font-medium text-[var(--ink)] transition hover:brightness-110"
        >
          Add spot
        </Link>
        {configured ? (
          email ? (
            <button
              type="button"
              onClick={signOut}
              className="text-[var(--sand-muted)] hover:text-[var(--sand)]"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-[var(--sand-muted)] hover:text-[var(--sand)]"
            >
              Sign in
            </Link>
          )
        ) : null}
      </nav>
    </header>
  );
}
