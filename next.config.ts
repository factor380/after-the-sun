import type { NextConfig } from "next";
import { contentSecurityPolicy } from "./src/lib/content-security-policy";
import { LEGACY_JUDEA_SAMARIA_PATH } from "./src/lib/regions";
import { legacyProductionRedirects } from "./src/lib/site-url";

// Static CSP must allow 'unsafe-inline' scripts - Next.js bootstrap sets self.__next_r inline.
const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy(isDev),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/spot-photos/**",
        search: "",
      },
    ],
  },
  async redirects() {
    return [
      // Exact host only. Preview URLs and localhost do not match.
      // Next forwards the query string.
      ...legacyProductionRedirects(),
      {
        source: "/50",
        destination: "/about",
        permanent: true,
      },
      {
        source: LEGACY_JUDEA_SAMARIA_PATH,
        destination: "/regions",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/apple-touch-icon.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
