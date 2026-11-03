"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { AMENITY_NOTE_MAX, type Accessibility, type Parking } from "@/types/spot";

/**
 * Enter in a one-line note, or on a radio, would submit the surrounding spot
 * form. These questions are optional, so Enter stays in the field.
 */
function preventEnterSubmit(event: React.KeyboardEvent) {
  if (event.key === "Enter") event.preventDefault();
}

function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  noteLabel,
  noteValue,
  notePlaceholder,
  onNoteChange,
}: {
  legend: string;
  name: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  noteLabel: string;
  noteValue: string;
  notePlaceholder: string;
  onNoteChange: (value: string) => void;
}) {
  const noteId = `${name}-note`;

  return (
    <fieldset className="space-y-2" onKeyDown={preventEnterSubmit}>
      <legend className="mb-1 text-sm text-[var(--sand-muted)]">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--sand)]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-[var(--ember)]"
            />
            {option.label}
          </label>
        ))}
      </div>
      <div>
        <label htmlFor={noteId} className="mb-1 block text-xs text-[var(--sand-muted)]">
          {noteLabel}
        </label>
        <input
          id={noteId}
          type="text"
          value={noteValue}
          maxLength={AMENITY_NOTE_MAX}
          onChange={(event) => onNoteChange(event.target.value)}
          onKeyDown={preventEnterSubmit}
          placeholder={notePlaceholder}
          autoComplete="off"
          className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--sand)] outline-none focus:border-[var(--ember)]"
        />
      </div>
    </fieldset>
  );
}

export default function SpotAmenityFields({
  parking,
  parkingNote,
  accessibility,
  accessibilityNote,
  onParking,
  onParkingNote,
  onAccessibility,
  onAccessibilityNote,
}: {
  parking: Parking | null;
  parkingNote: string;
  accessibility: Accessibility | null;
  accessibilityNote: string;
  onParking: (value: Parking) => void;
  onParkingNote: (value: string) => void;
  onAccessibility: (value: Accessibility) => void;
  onAccessibilityNote: (value: string) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      <ChoiceGroup
        legend={t("parkingQuestion")}
        name="parking"
        value={parking}
        options={parkingOptions(t)}
        onChange={onParking}
        noteLabel={t("parkingNoteLabel")}
        noteValue={parkingNote}
        notePlaceholder={t("parkingNotePlaceholder")}
        onNoteChange={onParkingNote}
      />
      <ChoiceGroup
        legend={t("accessibilityQuestion")}
        name="accessibility"
        value={accessibility}
        options={accessibilityOptions(t)}
        onChange={onAccessibility}
        noteLabel={t("accessibilityNoteLabel")}
        noteValue={accessibilityNote}
        notePlaceholder={t("accessibilityNotePlaceholder")}
        onNoteChange={onAccessibilityNote}
      />
    </div>
  );
}

function parkingOptions(t: (key: MessageKey) => string): { value: Parking; label: string }[] {
  return [
    { value: "yes", label: t("parkingYes") },
    { value: "paid", label: t("parkingPaid") },
    { value: "no", label: t("parkingNo") },
  ];
}

function accessibilityOptions(
  t: (key: MessageKey) => string,
): { value: Accessibility; label: string }[] {
  return [
    { value: "yes", label: t("accessibilityYes") },
    { value: "partial", label: t("accessibilityPartial") },
    { value: "no", label: t("accessibilityNo") },
  ];
}
