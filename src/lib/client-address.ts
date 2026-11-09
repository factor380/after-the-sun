const ADDRESS = /^[0-9a-fA-F:.]+$/;

type HeaderSource = {
  headers: { get(name: string): string | null };
};

/**
 * First forwarded address, then x-real-ip.
 * Anything that is not a short IP token shares the "unknown" bucket.
 */
export function clientAddress(request: HeaderSource): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const raw = (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim();
  if (!raw || raw.length > 64 || !ADDRESS.test(raw)) return "unknown";
  return raw;
}
