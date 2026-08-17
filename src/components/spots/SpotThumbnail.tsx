type SpotThumbnailProps = {
  url: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
};

/**
 * Cover image for a spot. Renders nothing when the spot has no photo, so
 * callers must skip the surrounding frame themselves.
 */
export function SpotThumbnail({
  url,
  alt,
  className = "",
  priority = false,
}: SpotThumbnailProps) {
  if (!url) {
    return null;
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover object-center ${className}`}
    />
  );
}

export function PhotoCountBadge({ count }: { count: number }) {
  if (count < 2) return null;

  return (
    <span
      className="pointer-events-none absolute bottom-1 end-1 bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white"
      aria-hidden
    >
      {count}
    </span>
  );
}
