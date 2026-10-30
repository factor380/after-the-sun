import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { JERUSALEM_SUNSET_GUIDE } from "@/lib/guides/jerusalem-sunset";
import { OG_CONTENT_TYPE, OG_SIZE, OgRtlText } from "@/lib/og-card";

/**
 * Share card for the Jerusalem sunset guide.
 * Photo: public cover of גן הקיפוד (/spots/cmujygjcz0001l604bdtrkxhz), cropped to the sunset.
 */
export const alt = `${JERUSALEM_SUNSET_GUIDE.title} — גן הקיפוד`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";
export const revalidate = 600;

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
              width: "100%",
              justifyContent: "flex-end",
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
          </div>
          <OgRtlText
            text={JERUSALEM_SUNSET_GUIDE.title}
            fontSize={52}
            color="#f3e4d4"
            lineHeight={1.2}
          />
          <OgRtlText text="גן הקיפוד, ירושלים" fontSize={32} color="#f3e4d4" />
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
