import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * A missing database during `next build` or local dev should not fail the page.
 * A failed production revalidation must throw so Next keeps the last good cache.
 */
export function allowStaticDataFallback(): boolean {
  return (
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ||
    process.env.NODE_ENV !== "production"
  );
}
