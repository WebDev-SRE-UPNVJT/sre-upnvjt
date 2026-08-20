import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { HeaderWrapper, FooterWrapper, VisitorTrackerWrapper } from "@/components/NavigationWrapper";
import { Providers } from "@/components/Providers";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { db } from "@/lib/db";
import { systemSetting } from "@/db/schema";
import { eq } from "drizzle-orm";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://www.sreupnjatim.com"),
  title: {
    default: "SRE UPN Veteran Jawa Timur | Accelerating Sustainable Transition",
    template: "%s | SRE UPN Veteran Jawa Timur",
  },
  description: "Empowering the next generation of renewable energy leaders. Society of Renewable Energy (SRE) UPN Veteran Jawa Timur drives clean energy advocacy, academic research, and community-led green technology projects.",
  keywords: [
    "SRE UPN Veteran Jawa Timur",
    "SRE UPN Jatim",
    "Society of Renewable Energy",
    "SRE Indonesia",
    "Energi Baru Terbarukan",
    "Renewable Energy Surabaya",
    "Green Transition",
    "Clean Energy Transition",
    "Mahasiswa Teknik Energi",
  ],
  authors: [{ name: "SRE UPN Veteran Jawa Timur", url: "https://www.sreupnjatim.com" }],
  creator: "SRE UPN Veteran Jawa Timur",
  publisher: "SRE UPN Veteran Jawa Timur",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SRE UPN Veteran Jawa Timur | Accelerating Sustainable Transition",
    description: "Empowering the next generation of renewable energy leaders. Society of Renewable Energy (SRE) UPN Veteran Jawa Timur drives clean energy advocacy, academic research, and community-led green technology projects.",
    url: "https://www.sreupnjatim.com",
    siteName: "SRE UPN Veteran Jawa Timur",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SRE UPN Veteran Jawa Timur",
    description: "Empowering the next generation of renewable energy leaders. Society of Renewable Energy (SRE) UPN Veteran Jawa Timur.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({ children }) {
  let appLanguage = "id";
  try {
    const langSetting = await db.query.systemSetting.findFirst({
      where: eq(systemSetting.keyName, "APP_LANGUAGE")
    });
    if (langSetting) appLanguage = langSetting.valueData;
  } catch (e) {
    // ignore
  }

  return (
    <html
      lang={appLanguage}
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased scroll-smooth`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <Providers>
          <LanguageProvider initialLanguage={appLanguage}>
            <HeaderWrapper />
            <VisitorTrackerWrapper />
            {children}
            <FooterWrapper />
            <FloatingThemeToggle />
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
