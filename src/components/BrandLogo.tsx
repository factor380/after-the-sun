"use client";

import { useId } from "react";

type BrandLogoProps = {
  title: string;
  className?: string;
  markClassName?: string;
  titleClassName?: string;
  showTitle?: boolean;
};

/** Sunset disc settling behind a hill triangle — brand mark for After the Sun. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const sunId = `ats-sun-${uid}`;
  const glowId = `ats-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <radialGradient id={sunId} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffd36a" />
          <stop offset="55%" stopColor="var(--ember)" />
          <stop offset="100%" stopColor="var(--horizon)" />
        </radialGradient>
        <linearGradient id={glowId} x1="20" y1="8" x2="20" y2="28">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="20" cy="18" rx="14" ry="10" fill={`url(#${glowId})`} />
      <circle cx="20" cy="22" r="9" fill={`url(#${sunId})`} />
      <path d="M2 36 L20 14 L38 36 Z" fill="var(--ink)" fillOpacity="0.88" />
      <path
        d="M6 33.5 L20 16.5 L34 33.5"
        stroke="#fff3e8"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandLogo({
  title,
  className = "inline-flex items-center gap-2.5",
  markClassName = "size-8 md:size-9",
  titleClassName = "font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--sand)] md:text-3xl",
  showTitle = true,
}: BrandLogoProps) {
  return (
    <span className={className}>
      <BrandMark className={`shrink-0 ${markClassName}`} />
      {showTitle ? <span className={titleClassName}>{title}</span> : null}
    </span>
  );
}
