"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationPickerClient from "@/components/map/LocationPickerClient";

export default function SpotForm() {
  const router = useRouter();
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
      setError("Click the map to set the spot location.");
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
        throw new Error(data.error ?? "Failed to save spot");
      }

      router.push(`/spots/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save spot");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder="Jaffa Port lookout"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          Description
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder="Why is this a great sunset spot?"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          Region (optional)
        </label>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder="Tel Aviv"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--sand-muted)]">
          Photo URL (optional)
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          className="w-full border border-white/15 bg-black/20 px-3 py-2 text-[var(--sand)] outline-none focus:border-[var(--ember)]"
          placeholder="https://..."
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-[var(--sand-muted)]">
          Tap the map to drop a pin
          {lat !== null && lng !== null
            ? ` · ${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : ""}
        </p>
        <LocationPickerClient
          lat={lat}
          lng={lng}
          onPick={(nextLat, nextLng) => {
            setLat(nextLat);
            setLng(nextLng);
          }}
        />
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="bg-[var(--ember)] px-5 py-2.5 font-medium text-[var(--ink)] transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Share spot"}
      </button>
    </form>
  );
}
