import type { Metadata } from "next";
import { Fraunces, Heebo, Outfit } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import WelcomeModal from "@/components/WelcomeModal";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
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

const hebrew = Heebo({
  variable: "--font-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "After the Sun — Sunset spots in Israel",
  description: "Discover and share the best sunset spots across Israel.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/icon" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${hebrew.variable} h-dvh overflow-hidden`}
      suppressHydrationWarning
    >
      <body className="atmosphere flex h-dvh flex-col overflow-hidden antialiased">
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- blocking boot avoids RTL flash */}
        <script src="/scripts/locale-boot.js" />
        <LocaleProvider>
          <SiteHeader />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto pt-16">
            {children}
          </main>
          <WelcomeModal />
        </LocaleProvider>
      </body>
    </html>
  );
}
