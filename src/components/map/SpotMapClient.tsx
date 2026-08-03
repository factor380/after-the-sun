"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { SpotSummary } from "@/types/spot";

const SpotMap = dynamic(() => import("@/components/map/SpotMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const { t } = useLocale();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--dusk-deep)] text-[var(--sand)]">
      {t("loadingMap")}
    </div>
  );
}

export default function SpotMapClient({ spots }: { spots: SpotSummary[] }) {
  return <SpotMap spots={spots} />;
}
