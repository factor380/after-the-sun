"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export function T({ k }: { k: MessageKey }) {
  const { t } = useLocale();
  return <>{t(k)}</>;
}
