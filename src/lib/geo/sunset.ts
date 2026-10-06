/**
 * Local sunset time. No network: latitude, longitude, and the civil date
 * in Asia/Jerusalem are enough. Accurate to about a minute.
 *
 * Solar geometry follows the SunCalc formulation (Meeus): sunset is the
 * moment the sun center is 0.833° below the horizon.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;
const OBLIQUITY = RAD * 23.4397;
/** Official sunset: refraction plus the sun's apparent radius. */
const SUNSET_ALTITUDE = -0.833 * RAD;
const CACHE_LIMIT = 400;

const cache = new Map<string, string | null>();

const jerusalemClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jerusalem",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const jerusalemDay = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Jerusalem",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function jerusalemDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} | null {
  const parts = jerusalemDay.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };
  const year = read("year");
  const month = read("month");
  const day = read("day");
  if (year === null || month === null || day === null) return null;
  return { year, month, day };
}

function toJulian(date: Date): number {
  return date.valueOf() / DAY_MS - 0.5 + J1970;
}

function fromJulian(julian: number): Date {
  return new Date((julian + 0.5 - J1970) * DAY_MS);
}

function solarMeanAnomaly(days: number): number {
  return RAD * (357.5291 + 0.98560028 * days);
}

function eclipticLongitude(anomaly: number): number {
  const center =
    RAD *
    (1.9148 * Math.sin(anomaly) +
      0.02 * Math.sin(2 * anomaly) +
      0.0003 * Math.sin(3 * anomaly));
  return anomaly + center + RAD * 102.9372 + Math.PI;
}

function declination(longitude: number): number {
  return Math.asin(Math.sin(longitude) * Math.sin(OBLIQUITY));
}

function hourAngle(altitude: number, lat: number, dec: number): number | null {
  const cosHour =
    (Math.sin(altitude) - Math.sin(lat) * Math.sin(dec)) /
    (Math.cos(lat) * Math.cos(dec));
  if (cosHour < -1 || cosHour > 1) return null;
  return Math.acos(cosHour);
}

/** Sunset instant for a civil date in Asia/Jerusalem. `lng` is east-positive. */
function sunsetInstant(
  lat: number,
  lng: number,
  year: number,
  month: number,
  day: number,
): Date | null {
  const anchor = new Date(Date.UTC(year, month - 1, day, 12));
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const days = toJulian(anchor) - J2000;
  const cycle = Math.round(days - 0.0009 - lw / (2 * Math.PI));

  // Noon first, then once more at the estimated sunset so declination
  // matches the evening rather than midday.
  let sample = 0.0009 + lw / (2 * Math.PI) + cycle;
  let julian = 0;
  for (let pass = 0; pass < 2; pass += 1) {
    const anomaly = solarMeanAnomaly(sample);
    const longitude = eclipticLongitude(anomaly);
    const dec = declination(longitude);
    const setAngle = hourAngle(SUNSET_ALTITUDE, phi, dec);
    if (setAngle === null) return null;
    sample = 0.0009 + (setAngle + lw) / (2 * Math.PI) + cycle;
    julian =
      J2000 +
      sample +
      0.0053 * Math.sin(anomaly) -
      0.0069 * Math.sin(2 * longitude);
  }

  const instant = fromJulian(julian);
  if (Number.isNaN(instant.getTime())) return null;
  return instant;
}

/**
 * Today's sunset as `HH:MM` in Asia/Jerusalem, or null outside the polar day.
 * Rounded coordinates from the same civil day share one calculation.
 */
export function sunsetTime(
  lat: number,
  lng: number,
  date: Date = new Date(),
): string | null {
  if (!isValidCoord(lat, lng)) return null;
  const parts = jerusalemDateParts(date);
  if (!parts) return null;

  const key = `${parts.year}-${parts.month}-${parts.day}|${Math.round(lat * 100)}|${Math.round(lng * 100)}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const instant = sunsetInstant(lat, lng, parts.year, parts.month, parts.day);
  const label = instant ? jerusalemClock.format(instant) : null;
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, label);
  return label;
}
