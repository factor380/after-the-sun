"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  safeWhatsAppHref,
  shareOrCopySpot,
  webShareAvailable,
  type ShareTarget,
} from "@/lib/spot-share-action";
import type { SpotSharePayload } from "@/lib/spot-share";

type ShareSpotButtonProps = {
  title: string;
  text: string;
  url: string;
  whatsAppHref: string;
};

const actionClassName =
  "inline-flex items-center border border-[var(--line)] px-4 py-2 text-sm text-[var(--sand-muted)] transition hover:border-[var(--ember)] hover:text-[var(--sand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ember)]";

/**
 * Share control for one spot. The page stays a server component and passes
 * the already-built title, text, and canonical URL.
 */
export default function ShareSpotButton({
  title,
  text,
  url,
  whatsAppHref,
}: ShareSpotButtonProps) {
  const { t } = useLocale();
  const payload = useMemo<SpotSharePayload>(
    () => ({ title, text, url }),
    [title, text, url],
  );
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const whatsApp = safeWhatsAppHref(whatsAppHref);
  const label = t("shareThisSpot");
  // Server HTML omits the WhatsApp link. After hydration, desktop (no share
  // sheet) shows it, and phones that can share keep it hidden.
  const nativeShare = useSyncExternalStore(
    subscribeShareSupport,
    () => webShareAvailable(browserShareTarget(), payload),
    () => true,
  );

  async function onShare() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await shareOrCopySpot(payload, browserShareTarget());
      setCopied(result === "copied");
    } catch {
      setCopied(false);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onShare}
          aria-label={label}
          aria-busy={busy}
          aria-describedby={copied ? "spot-share-status" : undefined}
          className={actionClassName}
        >
          {label}
        </button>
        {nativeShare === false && whatsApp ? (
          <a
            href={whatsApp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("shareOnWhatsApp")}
            className={actionClassName}
          >
            {t("shareOnWhatsApp")}
          </a>
        ) : null}
      </div>
      {copied ? (
        <p id="spot-share-status" role="status" className="mt-2 text-sm font-medium text-[var(--ember)]">
          {t("shareLinkCopied")}
        </p>
      ) : null}
    </div>
  );
}

function subscribeShareSupport() {
  return () => {};
}

function browserShareTarget(): ShareTarget {
  const clipboard = navigator.clipboard;
  return {
    share:
      typeof navigator.share === "function"
        ? (data) => navigator.share!(data)
        : undefined,
    canShare:
      typeof navigator.canShare === "function"
        ? (data) => navigator.canShare!(data)
        : undefined,
    clipboard:
      clipboard && typeof clipboard.writeText === "function"
        ? { writeText: (value) => clipboard.writeText(value) }
        : undefined,
  };
}
