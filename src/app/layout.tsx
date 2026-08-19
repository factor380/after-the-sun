import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import WelcomeModal from "@/components/WelcomeModal";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import "./globals.css";

const display = Frank_Ruhl_Libre({
  variable: "--font-display",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
});

const body = Heebo({
  variable: "--font-body",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

const BASE_URL = "https://after-the-sun.vercel.app";

export const metadata: Metadata = {
  title: "After the Sun — נקודות שקיעה בישראל",
  description: "גלו ושתפו את נקודות השקיעה הטובות ביותר ברחבי ישראל.",
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/icon" }],
  },
  openGraph: {
    title: "After the Sun — נקודות שקיעה בישראל",
    description: "גלו ושתפו את נקודות השקיעה הטובות ביותר ברחבי ישראל.",
    url: BASE_URL,
    siteName: "After the Sun",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "After the Sun — נקודות שקיעה בישראל",
    description: "גלו ושתפו את נקודות השקיעה הטובות ביותר ברחבי ישראל.",
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: "U9tACvFFsvys8bDLBHwatwejUVYEGK5FKMC4t6jjRTI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${display.variable} ${body.variable} locale-he h-dvh overflow-hidden`}
      suppressHydrationWarning
    >
      <body className="atmosphere flex h-dvh flex-col overflow-hidden antialiased">
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- blocking boot avoids RTL/theme flash */}
        <script src="/scripts/locale-boot.js" />
        <LocaleProvider>
          <ThemeProvider>
            <SiteHeader />
            <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto pt-16">
              {children}
            </main>
            <WelcomeModal />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
