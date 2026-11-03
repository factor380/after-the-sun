import { spotAmenityDetails, spotAmenityIcons } from "@/lib/spot-amenities";

type AmenityFields = {
  parking?: string | null;
  parkingNote?: string | null;
  accessibility?: string | null;
  accessibilityNote?: string | null;
};

/** 🅿️ / ♿ beside a spot name. Hidden for `no` and for an empty answer. */
export function SpotAmenityIcons({
  parking,
  accessibility,
  className,
  labelled = true,
}: {
  parking?: string | null;
  accessibility?: string | null;
  className?: string;
  /** Spot page repeats the label in text, so the heading icon stays decorative. */
  labelled?: boolean;
}) {
  const icons = spotAmenityIcons({ parking, accessibility });
  if (icons.length === 0) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 ${className ?? ""}`}
      {...(labelled ? {} : { "aria-hidden": true })}
    >
      {icons.map((icon) => (
        <span
          key={icon.kind}
          {...(labelled
            ? { role: "img" as const, "aria-label": icon.label }
            : {})}
          title={icon.label}
          className="leading-none"
        >
          <span aria-hidden="true">{icon.symbol}</span>
        </span>
      ))}
    </span>
  );
}

/** Visible labels and notes on the spot page. Icons stay next to the name. */
export function SpotAmenityNotes({ spot }: { spot: AmenityFields }) {
  const details = spotAmenityDetails(spot);
  if (details.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {details.map((item) => (
        <div key={item.kind}>
          <p className="text-sm font-medium text-[var(--sand)]">{item.label}</p>
          {item.note ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--sand-muted)]">
              {item.note}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
