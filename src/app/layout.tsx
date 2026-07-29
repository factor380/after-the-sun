import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "After the Sun — Sunset spots in Israel",
  description: "Discover and share the best sunset spots across Israel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="atmosphere min-h-full antialiased">
        <SiteHeader />
        <main className="relative flex min-h-full flex-1 flex-col pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
