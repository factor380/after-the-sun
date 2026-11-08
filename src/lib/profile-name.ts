/** Display name stored on the profile after Google sign-in. */
export function profileDisplayName(
  metadata: { full_name?: unknown; name?: unknown } | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const { full_name: fullName, name } = metadata;
  if (typeof fullName === "string") return fullName;
  if (fullName == null && typeof name === "string") return name;
  return null;
}
