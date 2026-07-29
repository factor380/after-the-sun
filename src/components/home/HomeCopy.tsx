"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export function HomeTagline() {
  const { t } = useLocale();
  return <>{t("tagline")}</>;
}

export function HomeBrand() {
  const { t } = useLocale();
  return <>{t("brand")}</>;
}

export function SpotsHeading({ count }: { count: number }) {
  const { t } = useLocale();
  return (
    <>
      {t("spots")} ({count})
    </>
  );
}

export function SetupNeededNotice() {
  const { t } = useLocale();
  return <>{t("setupNeeded")}</>;
}
