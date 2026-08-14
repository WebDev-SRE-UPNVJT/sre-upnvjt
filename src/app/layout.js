import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { HeaderWrapper, FooterWrapper, VisitorTrackerWrapper } from "@/components/NavigationWrapper";
import { Providers } from "@/components/Providers";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { db } from "@/lib/db";
import { systemSetting } from "@/db/schema";
import { eq } from "drizzle-orm";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import { cookies } from "next/headers";

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
  title: "SRE UPN Veteran Jawa Timur | Accelerating Sustainable Transition",
  description: "Empowering the next generation of renewable energy leaders. Society of Renewable Energy (SRE) UPN Veteran Jawa Timur drives clean energy advocacy, academic research, and community-led green technology projects.",
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

  // Site Gate Check to hide Header & Footer
  const cookieStore = await cookies();
  const siteStatus = (process.env.SITE_STATUS || process.env.COMING_SOON_MODE || "off").toLowerCase();
  const siteSecret = process.env.SITE_GATE_SECRET || process.env.COMING_SOON_SECRET || "secret123";

  const isGateActive = siteStatus === "coming-soon" || siteStatus === "maintenance" || siteStatus === "true";
  const cookieSecret = cookieStore.get("team_access")?.value;
  const hasValidCookie = cookieSecret === siteSecret || cookieSecret === "granted";

  const isGateShowing = isGateActive && !hasValidCookie;

  return (
    <html
      lang={appLanguage}
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased scroll-smooth`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <Providers>
          <LanguageProvider initialLanguage={appLanguage}>
            {!isGateShowing && <HeaderWrapper />}
            {!isGateShowing && <VisitorTrackerWrapper />}
            {children}
            {!isGateShowing && <FooterWrapper />}
            {!isGateShowing && <FloatingThemeToggle />}
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}

