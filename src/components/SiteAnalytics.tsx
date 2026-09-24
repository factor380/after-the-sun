"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function redactAnalyticsUrl(event: BeforeSendEvent) {
  try {
    const url = new URL(event.url);
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

export default function SiteAnalytics() {
  return <Analytics beforeSend={redactAnalyticsUrl} />;
}
