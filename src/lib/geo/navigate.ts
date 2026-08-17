/** Hands the destination to the device so it offers the navigation apps installed on it. */

/** Android and most desktop OSes resolve `geo:` through their app chooser. */
export function geoNavigateUrl(lat: number, lng: number, label?: string): string {
  const query = label
    ? `${lat},${lng}(${encodeURIComponent(label)})`
    : `${lat},${lng}`;
  return `geo:${lat},${lng}?q=${query}`;
}

/** iOS ignores `geo:`, so it gets handed to Maps, which then offers other routing apps. */
export function appleMapsNavigateUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
}

export function isIosUserAgent(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent);
}
