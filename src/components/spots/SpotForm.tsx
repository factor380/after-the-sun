"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function SpotForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (lat === null || lng === null) {
      setError(t("clickMapError"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          region: region || null,
          lat,
          lng,
          photoUrl: photoUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? t("saveFailed"));
      }

      router.push(`/spots/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("name")}
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("namePlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("description")}
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("regionOptional")}
        </label>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder={t("regionPlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          {t("photoUrlOptional")}
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder="https://..."
          pattern="https://.*"
          title="HTTPS URL only"
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-[var(--sand-muted)]">
          {t("tapMap")}
          {lat !== null && lng !== null
            ? ` · ${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : ""}
        </p>
        <div className="h-64 w-full overflow-hidden rounded-sm">
          <LocationPickerClient
            lat={lat}
            lng={lng}
            onPick={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
            }}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="bg-[var(--ember)] px-5 py-2.5 font-medium text-[var(--ink)] transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? t("saving") : t("shareSpot")}
      </button>
    </form>
  );
}
