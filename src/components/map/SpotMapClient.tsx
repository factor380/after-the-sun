"use client";

import dynamic from "next/dynamic";
import type { SpotSummary } from "@/types/spot";

const SpotMap = dynamic(() => import("@/components/map/SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--dusk-deep)] text-[var(--sand)]">
      Loading map…
    </div>
  ),
});

export default function SpotMapClient({ spots }: { spots: SpotSummary[] }) {
  return <SpotMap spots={spots} />;
}
