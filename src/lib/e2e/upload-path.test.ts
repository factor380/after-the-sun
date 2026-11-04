import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveE2EUploadPath } from "@/lib/e2e/upload-path";

const root = path.join(os.tmpdir(), "after-the-sun-e2e-uploads");

describe("resolveE2EUploadPath", () => {
  it("keeps a user folder and file name inside the root", () => {
    const resolved = resolveE2EUploadPath(
      root,
      "00000000-0000-4000-8000-0000000000e2/photo.jpg",
    );
    expect(resolved).toBe(
      path.join(root, "00000000-0000-4000-8000-0000000000e2", "photo.jpg"),
    );
  });

  it("rejects paths that leave the root", () => {
    expect(resolveE2EUploadPath(root, "../secret")).toBeNull();
    expect(resolveE2EUploadPath(root, "user/../../secret")).toBeNull();
    expect(resolveE2EUploadPath(root, "/etc/passwd")).toBeNull();
    expect(resolveE2EUploadPath(root, "")).toBeNull();
    expect(resolveE2EUploadPath(root, "a/\0/b")).toBeNull();
  });
});
