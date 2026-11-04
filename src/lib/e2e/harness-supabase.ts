import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { SPOT_PHOTOS_BUCKET } from "@/lib/spot-photo";
import {
  E2E_TEST_USER_COOKIE,
  E2E_TEST_USER_HEADER,
  E2E_TEST_USER_ID,
  hostnameFromHostHeader,
  isE2ETestHarnessEnabled,
} from "@/lib/e2e/guard";
import type { ServerSupabase } from "@/lib/e2e/server-supabase";
import { e2eUploadRoot, resolveE2EUploadPath } from "@/lib/e2e/upload-path";

type HarnessRequest = { presented: boolean } | null;

async function readHarnessRequest(): Promise<HarnessRequest> {
  try {
    const headerStore = await headers();
    const hostname = hostnameFromHostHeader(headerStore.get("host"));
    if (!isE2ETestHarnessEnabled(hostname)) return null;
    const cookieStore = await cookies();
    const presented =
      headerStore.get(E2E_TEST_USER_HEADER) === "1" ||
      cookieStore.get(E2E_TEST_USER_COOKIE)?.value === "1";
    return { presented };
  } catch {
    return null;
  }
}

/**
 * Stand-in for the Supabase server client.
 * Auth is the fixed test user, and only when the request presents the test
 * header or cookie. Photo bytes are written under the local upload root.
 * Nothing here calls Google or Supabase.
 */
export function createHarnessSupabase(): ServerSupabase {
  return {
    auth: {
      async getUser() {
        const request = await readHarnessRequest();
        if (!request?.presented) {
          return { data: { user: null }, error: null };
        }
        return { data: { user: { id: E2E_TEST_USER_ID } }, error: null };
      },
      async exchangeCodeForSession() {
        return {
          data: { user: null },
          error: { message: "Test harness does not accept OAuth codes" },
        };
      },
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(objectPath, body) {
            const request = await readHarnessRequest();
            if (!request?.presented) {
              return { error: { message: "Test storage is disabled" } };
            }
            if (bucket !== SPOT_PHOTOS_BUCKET) {
              return { error: { message: "Unknown bucket" } };
            }
            const target = resolveE2EUploadPath(e2eUploadRoot(), objectPath);
            if (!target) return { error: { message: "Invalid upload path" } };
            await mkdir(path.dirname(target), { recursive: true });
            await writeFile(target, body);
            return { error: null };
          },
          async remove(paths) {
            const request = await readHarnessRequest();
            if (!request?.presented) {
              return { error: { message: "Test storage is disabled" } };
            }
            for (const objectPath of paths) {
              const target = resolveE2EUploadPath(e2eUploadRoot(), objectPath);
              if (!target) return { error: { message: "Invalid upload path" } };
              try {
                await unlink(target);
              } catch (error) {
                const code =
                  error && typeof error === "object" && "code" in error
                    ? String(error.code)
                    : "";
                if (code !== "ENOENT") {
                  return { error: { message: "Failed to remove photo" } };
                }
              }
            }
            return { error: null };
          },
          getPublicUrl(objectPath: string) {
            const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
              .trim()
              .replace(/\/$/, "");
            return {
              data: {
                publicUrl: `${base}/storage/v1/object/public/${bucket}/${objectPath}`,
              },
            };
          },
        };
      },
    },
  };
}
