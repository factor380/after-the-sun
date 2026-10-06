"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export function SunsetChip({ time }: { time: string }) {
  const { t } = useLocale();

  return (
    <p className="pointer-events-auto flex items-center gap-2 border border-[var(--ember)]/25 bg-[var(--surface)] px-3 py-1.5 text-sm shadow-[0_8px_24px_rgb(42_18_16/0.12)]">
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
        className="shrink-0 text-[var(--ember)]"
      >
        <path
          d="M2.5 11.5h11M4.5 11.5a3.5 3.5 0 0 1 7 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[var(--sand-muted)]">{t("sunsetToday")}</span>
      <time dateTime={time} className="font-medium tabular-nums text-[var(--sand)]">
        {time}
      </time>
    </p>
  );
}
