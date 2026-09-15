"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl" className="locale-he min-h-dvh">
      <body className="atmosphere min-h-dvh antialiased">
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- blocking boot avoids RTL/theme flash */}
        <script src="/scripts/locale-boot.js" />
        <ErrorScreen onRetry={unstable_retry ?? reset} />
      </body>
    </html>
  );
}
