"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  dictionary,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/dictionaries";

type LocaleContextValue = {
  locale: Locale;
  t: (key: MessageKey) => string;
  dir: "rtl";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = "he";
    root.dir = "rtl";
    root.classList.add("locale-he");
    try {
      window.localStorage.removeItem("ats-locale");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: "he",
      t: (key) => dictionary[key],
      dir: "rtl",
    }),
    [],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
