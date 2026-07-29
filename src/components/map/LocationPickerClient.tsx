"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () =>
    import("@/components/map/SpotMap").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center bg-[var(--dusk-mid)] text-[var(--sand)]">
        Loading map…
      </div>
    ),
  },
);

type Props = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
};

export default function LocationPickerClient(props: Props) {
  return <LocationPicker {...props} />;
}
