"use client";

import { useId } from "react";

type BrandLogoProps = {
  title: string;
  className?: string;
  markClassName?: string;
  titleClassName?: string;
  showTitle?: boolean;
};

/** Sunset disc settling behind a hill triangle - brand mark for After the Sun. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const sunId = `ats-sun-${uid}`;

  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id={sunId} x1="20" y1="4" x2="20" y2="28">
          <stop offset="0%" stopColor="#f47f6b" />
          <stop offset="55%" stopColor="var(--horizon)" />
          <stop offset="100%" stopColor="#e02f2f" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="16" r="10" fill={`url(#${sunId})`} />
      <path
        d="M4 38 L20 12 L36 38 Z"
        fill="currentColor"
        className="text-[var(--sand)]"
      />
    </svg>
  );
}

function WaveSun({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 16"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M4 8a6 6 0 0 1 12 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M2 11.2c1.4-1 2.8-1 4.2 0s2.8 1 4.2 0 2.8-1 4.2 0 2.8 1 4.2 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M3.5 14.2c1.2-.8 2.4-.8 3.6 0s2.4.8 3.6 0 2.4-.8 3.6 0 2.4.8 3.6 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BrandLogo({
  title,
  className = "inline-flex items-center",
  markClassName = "size-8 md:size-9",
  titleClassName = "font-[family-name:var(--font-display)] tracking-tight text-[var(--sand)]",
  showTitle = true,
}: BrandLogoProps) {
  if (!showTitle) {
    return (
      <span className={className}>
        <BrandMark className={`shrink-0 ${markClassName}`} />
      </span>
    );
  }

  return (
    <span dir="ltr" className={className}>
      <span className={`flex flex-col leading-none ${titleClassName}`}>
        <span className="flex items-center gap-1">
          <span className="text-[1.35em] font-semibold">After</span>
          <BrandMark className={`shrink-0 ${markClassName}`} />
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 pl-5 text-[0.72em] font-medium">
          <WaveSun className="size-[0.85em] text-[var(--ember)] opacity-80" />
          <span>the Sun</span>
        </span>
      </span>
      <span className="sr-only">{title}</span>
    </span>
  );
}
