import os from "node:os";
import path from "node:path";

/** Directory for photos saved by the test storage stub. */
export function e2eUploadRoot(): string {
  const configured = process.env.E2E_UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.join(os.tmpdir(), "after-the-sun-e2e-uploads");
}

/**
 * Map a bucket object path onto a file inside `root`.
 * Returns null when the path would leave that directory.
 */
export function resolveE2EUploadPath(root: string, objectPath: string): string | null {
  if (!objectPath || objectPath.includes("\0")) return null;
  const slash = objectPath.replaceAll("\\", "/");
  if (slash.startsWith("/")) return null;

  const normalized = path.posix.normalize(slash);
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.startsWith("/")
  ) {
    return null;
  }

  const rootResolved = path.resolve(root);
  const target = path.resolve(rootResolved, ...normalized.split("/"));
  const relative = path.relative(rootResolved, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return target;
}
