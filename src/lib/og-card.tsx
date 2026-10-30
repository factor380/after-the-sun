import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { rtlWordRuns } from "@/lib/og-rtl";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

let heeboBold: Promise<Buffer> | null = null;

function loadHeeboBold(): Promise<Buffer> {
  if (!heeboBold) {
    heeboBold = readFile(join(process.cwd(), "src/assets/og/Heebo-Bold.ttf"));
  }
  return heeboBold;
}

/**
 * Hebrew line for Satori. Words are already in visual order and the row runs
 * from the right. CSS `direction: rtl` is intentionally not set: Satori
 * reverses every character, which turns "12" into "21".
 */
export function OgRtlText({
  text,
  fontSize,
  color,
  lineHeight = 1.15,
}: {
  text: string;
  fontSize: number;
  color: string;
  lineHeight?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        columnGap: Math.round(fontSize * 0.3),
        rowGap: Math.round(fontSize * 0.18),
        width: "100%",
      }}
    >
      {rtlWordRuns(text).map((run, index) => (
        <div
          key={`${run}-${index}`}
          style={{
            display: "flex",
            fontFamily: "Heebo",
            fontSize,
            fontWeight: 700,
            lineHeight,
            color,
          }}
        >
          {run}
        </div>
      ))}
    </div>
  );
}

/** Hebrew RTL card shared by /about and the region pages. */
export async function renderOgCard(input: {
  title: string;
  subtitle: string;
}): Promise<ImageResponse> {
  const font = await loadHeeboBold();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(145deg, #1a1218 0%, #2c1e24 52%, #3a1c18 100%)",
          padding: "72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 78,
            left: 96,
            width: 230,
            height: 230,
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
            height: 180,
            background: "linear-gradient(180deg, transparent 0%, #120c10 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: 1000,
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
          <OgRtlText text={input.title} fontSize={60} color="#f3e4d4" />
          <OgRtlText text={input.subtitle} fontSize={36} color="#f3e4d4" lineHeight={1.2} />
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
