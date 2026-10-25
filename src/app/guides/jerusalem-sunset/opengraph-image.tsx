import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { JERUSALEM_SUNSET_GUIDE } from "@/lib/guides/jerusalem-sunset";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-card";

/**
 * Share card for the Jerusalem sunset guide.
 * Photo: public cover of גן הקיפוד (/spots/cmujygjcz0001l604bdtrkxhz), cropped to the sunset.
 */
export const alt = `${JERUSALEM_SUNSET_GUIDE.title} — גן הקיפוד`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function JerusalemSunsetOpenGraphImage() {
  const [font, photo] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/og/Heebo-Bold.ttf")),
    readFile(join(process.cwd(), "src/assets/og/jerusalem-gan-hakipod.jpg"), "base64"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          direction: "rtl",
          position: "relative",
          background: "#120c10",
          padding: 72,
        }}
      >
        <img
          src={`data:image/jpeg;base64,${photo}`}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 430,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(18,12,16,0.55) 36%, #120c10 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Heebo",
              fontSize: 28,
              fontWeight: 700,
              color: "#ff6b35",
            }}
          >
            After the Sun
          </div>
          <div
            style={{
              display: "flex",
              width: "100%",
              fontFamily: "Heebo",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#f3e4d4",
              textAlign: "right",
            }}
          >
            {JERUSALEM_SUNSET_GUIDE.title}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Heebo",
              fontSize: 32,
              fontWeight: 700,
              color: "#f3e4d4",
              textAlign: "right",
            }}
          >
            גן הקיפוד, ירושלים
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name: "Heebo",
          data: font,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
