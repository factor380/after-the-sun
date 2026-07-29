"use client";

import { localeLabels, type Locale } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const options: Locale[] = ["en", "he"];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1 text-sm"
    >
      {options.map((option, index) => (
        <span key={option} className="flex items-center gap-1">
          {index > 0 ? (
            <span className="text-[var(--sand-muted)]/50" aria-hidden>
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={locale === option}
            className={
              locale === option
                ? "font-medium text-[var(--sand)]"
                : "text-[var(--sand-muted)] hover:text-[var(--sand)]"
            }
          >
            {localeLabels[option]}
          </button>
        </span>
      ))}
    </div>
  );
}
