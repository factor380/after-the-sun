import type { Metadata } from "next";
import { Fredoka, Heebo } from "next/font/google";
import SiteAnalytics from "@/components/SiteAnalytics";
import SiteHeader from "@/components/SiteHeader";
import WelcomeModal from "@/components/WelcomeModal";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
  indexRobots,
} from "@/lib/seo";
import "./globals.css";

const display = Fredoka({
  variable: "--font-display",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
});

const body = Heebo({
  variable: "--font-body",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = getSiteUrl();
const defaultTitle = `${SITE_NAME} | ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "travel",
  keywords: [
    "נקודות שקיעה",
    "נקודות שקיעה בישראל",
    "שקיעה",
    "תצפית שקיעה",
    "מפת שקיעות",
    "After the Sun",
  ],
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  robots: indexRobots,
  openGraph: {
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: SITE_DESCRIPTION,
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
            <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto pt-[4.5rem] md:pt-20">
              {children}
            </main>
            <WelcomeModal />
          </ThemeProvider>
        </LocaleProvider>
        <SiteAnalytics />
      </body>
    </html>
  );
}
