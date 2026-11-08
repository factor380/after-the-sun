import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { contentSecurityPolicy } from "@/lib/content-security-policy";
import {
  GOOGLE_IDENTITY_GSI_PREFIX,
  GOOGLE_IDENTITY_SCRIPT_SRC,
  GOOGLE_IDENTITY_STYLE_SRC,
} from "@/lib/google-identity";

describe("contentSecurityPolicy", () => {
  it("allows Google Identity Services without opening the rest of the web", () => {
    const production = contentSecurityPolicy(false);
    const development = contentSecurityPolicy(true);

    for (const policy of [production, development]) {
      expect(policy).toContain(`script-src 'self' 'unsafe-inline' ${GOOGLE_IDENTITY_SCRIPT_SRC}`);
      expect(policy).toContain(GOOGLE_IDENTITY_STYLE_SRC);
      expect(policy).toContain(`frame-src 'self' ${GOOGLE_IDENTITY_GSI_PREFIX}`);
      expect(policy).toContain(GOOGLE_IDENTITY_GSI_PREFIX);
      expect(policy).toContain("https://*.supabase.co");
      expect(policy).not.toContain("https://accounts.google.com/gsi/client/");
    }

    expect(production).not.toContain("unsafe-eval");
    expect(production).not.toContain(" ws:");
    expect(development).toContain("'unsafe-eval'");
    expect(development).toContain(" ws: wss:");
  });

  it("is the policy next serves", async () => {
    const rules = await nextConfig.headers!();
    const site = rules.find((rule) => rule.source === "/:path*");
    const header = site?.headers.find((entry) => entry.key === "Content-Security-Policy");
    expect(header?.value).toBe(contentSecurityPolicy(process.env.NODE_ENV === "development"));
  });
});
