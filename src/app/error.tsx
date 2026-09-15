"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";

export default function ErrorPage({
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

  return <ErrorScreen onRetry={unstable_retry ?? reset} />;
}
