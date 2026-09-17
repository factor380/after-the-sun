import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const alt = `${SITE_NAME} — sunset spots in Israel`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(145deg, #1a1218 0%, #2c1e24 55%, #3a1c18 100%)",
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 90,
            right: 140,
            width: 280,
            height: 280,
            borderRadius: 999,
            background: "linear-gradient(180deg, #f47f6b 0%, #e02f2f 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 220,
            background: "linear-gradient(180deg, transparent 0%, #120c10 100%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#f3e4d4",
              letterSpacing: -1.5,
            }}
          >
            After the Sun
          </div>
          <div style={{ fontSize: 32, color: "#ff6b35", fontWeight: 600 }}>
            Sunset spots in Israel
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
