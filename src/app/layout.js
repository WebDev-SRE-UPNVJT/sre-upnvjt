import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { HeaderWrapper, FooterWrapper } from "@/components/NavigationWrapper";
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
            {children}
            <FooterWrapper />
            <FloatingThemeToggle />
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
