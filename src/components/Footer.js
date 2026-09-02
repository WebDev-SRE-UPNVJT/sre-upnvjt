"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

const InstagramIcon = (props) => (
  <svg className={`fill-current ${props.className || "w-4 h-4"}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const LinkedinIcon = (props) => (
  <svg className={`fill-current ${props.className || "w-4 h-4"}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const TikTokIcon = (props) => (
  <svg className={`fill-current ${props.className || "w-4 h-4"}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.73a8.27 8.27 0 004.83 1.55V6.82a4.85 4.85 0 01-1.06-.13z"/>
  </svg>
);

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/sre.upnjatim/",
    Icon: InstagramIcon,
    aria: "Follow SRE UPNVJT on Instagram",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/sreupnjatim/",
    Icon: LinkedinIcon,
    aria: "SRE UPNVJT on LinkedIn",
  },
  // {
  //   label: "TikTok",
  //   href: "https://tiktok.com/@sre.upnvjt",
  //   Icon: TikTokIcon,
  //   aria: "SRE UPNVJT on TikTok",
  // },
  {
    label: "Email",
    href: "mailto:upnvjatim@sre.co.id",
    Icon: Mail,
    aria: "Send an email to SRE UPNVJT",
  },
];

export default function Footer() {
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  useEffect(() => {
    setMounted(true);
  }, []);
  const isLight = mounted && (theme === "light" || resolvedTheme === "light");

  const adminRoutes = ["/dashboard", "/roles", "/users", "/departments", "/activities", "/merch", "/settings"];
  const isDashboardRoute = adminRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  if (pathname === "/login" || isDashboardRoute) return null;

  return (
    <div className="w-full flex flex-col mt-0 relative z-10">
      {/* Main Footer Body */}
      <footer className="bg-[#0bb37e] dark:bg-[#07130e] text-white/90 dark:text-white/70 border-transparent relative overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <Link href="/" className="mb-6 sm:mb-8 inline-block" aria-label="SRE UPNVJT Home">
            <Image
              src="/images/logo.png"
              alt="SRE UPNVJT Logo"
              width={140}
              height={50}
              className="h-10 sm:h-12 md:h-14 w-auto object-contain brightness-0 invert dark:brightness-0 dark:invert dark:opacity-50 opacity-95 hover:opacity-100 dark:hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Navigation Links — Responsive & Professional Font Hierarchy */}
          <nav className="mb-6 sm:mb-8 w-full max-w-2xl mx-auto" aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center items-center gap-x-5 sm:gap-x-8 md:gap-x-10 gap-y-2.5 sm:gap-y-3">
              {[
                { label: t("visitor.footer.home"), href: "/" },
                { label: t("visitor.footer.about"), href: "/about" },
                { label: t("visitor.footer.activity"), href: "/activity" },
                { label: t("visitor.footer.articles"), href: "/articles" },
                { label: t("visitor.footer.merchandise"), href: "/merchandise" }
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm md:text-base font-semibold text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-emerald-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social Media Links — Clean Interactive Icons */}
          <div className="flex justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {SOCIAL_LINKS.map(({ label, href, Icon, aria: ariaLabel }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
                aria-label={ariaLabel}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-emerald-500/20 text-white dark:text-gray-300 hover:text-white dark:hover:text-emerald-400 transition-all duration-300 transform hover:scale-105"
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </a>
            ))}
          </div>

          {/* Bottom Copyright */}
          <div className="text-[11px] sm:text-xs text-white/75 dark:text-gray-400 font-normal leading-relaxed max-w-md mx-auto">
            © {new Date().getFullYear()} Society of Renewable Energy UPN Veteran Jawa Timur. {t("visitor.footer.all_rights")}
          </div>
        </div>
      </footer>

      {/* Dynamic Renewable Energy Vector Scene — Plants, Turbines, and Solar Panels */}
      <div className={`w-full leading-[0] pointer-events-none select-none relative z-20 bg-[#0bb37e] dark:bg-[#07130e] border-t border-white/10 dark:border-transparent`}>
        <svg
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block h-[90px] md:h-[130px] lg:h-[180px]"
          aria-hidden="true"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .turbine-spin-1 {
              animation: spin-slow 12s linear infinite;
              transform-origin: 400px 70px;
            }
            .turbine-spin-2 {
              animation: spin-slow 18s linear infinite;
              transform-origin: 1040px 85px;
            }
            .turbine-spin-3 {
              animation: spin-slow 15s linear infinite;
              transform-origin: 740px 95px;
            }
          `}} />

          {/* Hills / Ground layers */}
          <path d="M 0 140 Q 360 110 720 140 T 1440 140 L 1440 180 L 0 180 Z" fill={isLight ? "#0a9468" : "#05100c"} opacity="0.4" />
          <path d="M 0 160 Q 400 130 800 160 T 1440 160 L 1440 180 L 0 180 Z" fill={isLight ? "#088c62" : "#030a08"} />

          {/* Left Trees Group */}
          {/* Tree 1 */}
          <rect x="148" y="145" width="4" height="20" fill={isLight ? "#e8ecc4" : "#10b981"} opacity="0.4" />
          <circle cx="150" cy="135" r="14" fill={isLight ? "#a7f3d0" : "#047857"} opacity="0.8" />
          
          {/* Tree 2 */}
          <rect x="178" y="148" width="4" height="20" fill={isLight ? "#e8ecc4" : "#10b981"} opacity="0.4" />
          <circle cx="180" cy="138" r="11" fill={isLight ? "#6ee7b7" : "#065f46"} opacity="0.7" />

          {/* Tree 3 */}
          <rect x="268" y="146" width="4" height="20" fill={isLight ? "#e8ecc4" : "#10b981"} opacity="0.4" />
          <circle cx="270" cy="136" r="13" fill={isLight ? "#a7f3d0" : "#047857"} opacity="0.75" />

          {/* Wind Turbine 1 (Big) */}
          {/* Tower */}
          <path d="M 397 165 L 400 70 L 403 165 Z" fill={isLight ? "#e8ecc4" : "#34d399"} opacity="0.7" />
          {/* Blades */}
          <g className="turbine-spin-1">
            <line x1="400" y1="70" x2="400" y2="25" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
            <line x1="400" y1="70" x2="361" y2="92.5" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
            <line x1="400" y1="70" x2="439" y2="92.5" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
            <circle cx="400" cy="70" r="4.5" fill={isLight ? "#e8ecc4" : "#10b981"} />
          </g>

          {/* Solar Panel Group (Center-Left) */}
          <g opacity="0.75">
            {/* Stand */}
            <line x1="575" y1="160" x2="575" y2="148" stroke={isLight ? "#e8ecc4" : "#10b981"} strokeWidth="2.5" />
            {/* Panel */}
            <polygon points="545,148 605,148 615,133 555,133" fill={isLight ? "#6ee7b7" : "#065f46"} stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="1.5" />
            {/* Grid Lines */}
            <line x1="575" y1="148" x2="585" y2="133" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="0.75" />
            <line x1="560" y1="148" x2="570" y2="133" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="0.75" />
            <line x1="590" y1="148" x2="600" y2="133" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="0.75" />
          </g>

          {/* Wind Turbine 3 (Medium height) */}
          {/* Tower */}
          <path d="M 737 165 L 740 95 L 743 165 Z" fill={isLight ? "#e8ecc4" : "#34d399"} opacity="0.6" />
          {/* Blades */}
          <g className="turbine-spin-3">
            <line x1="740" y1="95" x2="740" y2="55" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <line x1="740" y1="95" x2="705" y2="115" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <line x1="740" y1="95" x2="775" y2="115" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <circle cx="740" cy="95" r="4" fill={isLight ? "#e8ecc4" : "#10b981"} />
          </g>

          {/* Solar Panel Group (Center-Right) */}
          <g opacity="0.7">
            {/* Stand */}
            <line x1="885" y1="162" x2="885" y2="150" stroke={isLight ? "#e8ecc4" : "#10b981"} strokeWidth="2.5" />
            {/* Panel */}
            <polygon points="855,150 915,150 925,135 865,135" fill={isLight ? "#6ee7b7" : "#065f46"} stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="1.5" />
            {/* Grid Lines */}
            <line x1="885" y1="150" x2="895" y2="135" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="0.75" />
            <line x1="870" y1="150" x2="880" y2="135" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="0.75" />
            <line x1="900" y1="150" x2="910" y2="135" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="0.75" />
          </g>

          {/* Wind Turbine 2 (Smallest & Back) */}
          {/* Tower */}
          <path d="M 1038 165 L 1040 85 L 1042 165 Z" fill={isLight ? "#e8ecc4" : "#34d399"} opacity="0.5" />
          {/* Blades */}
          <g className="turbine-spin-2">
            <line x1="1040" y1="85" x2="1040" y2="48" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            <line x1="1040" y1="85" x2="1008" y2="103.5" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            <line x1="1040" y1="85" x2="1072" y2="103.5" stroke={isLight ? "#e8ecc4" : "#34d399"} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            <circle cx="1040" cy="85" r="3.5" fill={isLight ? "#e8ecc4" : "#10b981"} />
          </g>

          {/* Right Trees Group */}
          {/* Tree 4 */}
          <rect x="1198" y="144" width="4" height="20" fill={isLight ? "#e8ecc4" : "#10b981"} opacity="0.4" />
          <circle cx="1200" cy="134" r="14" fill={isLight ? "#a7f3d0" : "#047857"} opacity="0.8" />
          
          {/* Tree 5 */}
          <rect x="1228" y="147" width="4" height="20" fill={isLight ? "#e8ecc4" : "#10b981"} opacity="0.4" />
          <circle cx="1230" cy="137" r="11" fill={isLight ? "#6ee7b7" : "#065f46"} opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
