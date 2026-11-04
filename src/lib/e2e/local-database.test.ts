import { describe, expect, it } from "vitest";
import { assertLocalDatabase } from "@/lib/e2e/local-database";

describe("assertLocalDatabase", () => {
  it("accepts loopback Postgres and rejects hosted URLs", () => {
    expect(() =>
      assertLocalDatabase(
        "postgresql://ci:ci@127.0.0.1:5432/after_the_sun?schema=public",
        "DATABASE_URL",
      ),
    ).not.toThrow();

    expect(() =>
      assertLocalDatabase(
        "postgresql://user:secret@db.example.supabase.co:5432/postgres",
        "DATABASE_URL",
      ),
    ).toThrow(/local Postgres/);
  });
});
