import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Tab favicon: sun setting behind a hill triangle. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1c2438",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <ellipse cx="16" cy="13" rx="11" ry="7" fill="#e8893a" fillOpacity="0.35" />
          <circle cx="16" cy="15" r="7" fill="#e8893a" />
          <circle cx="16" cy="14" r="4.5" fill="#f6c46a" />
          <path d="M2 30 L16 11 L30 30 Z" fill="#1a1210" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
