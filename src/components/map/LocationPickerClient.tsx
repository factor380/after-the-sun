"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const LocationPicker = dynamic(
  () =>
    import("@/components/map/SpotMap").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

function MapLoading() {
  const { t } = useLocale();
  return (
    <div className="flex h-64 w-full items-center justify-center bg-[var(--dusk-mid)] text-[var(--sand)]">
      {t("loadingMap")}
    </div>
  );
}

type Props = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
};

export default function LocationPickerClient(props: Props) {
  return <LocationPicker {...props} />;
}
