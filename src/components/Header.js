"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sun, Moon, User, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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

function HamburgerIcon({ isOpen, onClick, useDarkText }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle menu"
      className="md:hidden relative w-12 h-12 flex flex-col items-center justify-center z-[70] group rounded-full overflow-hidden"
    >
      {/* Glassmorphic background when open */}
      <div 
        className={`absolute inset-0 transition-all duration-500 rounded-full ${
          isOpen ? 'bg-white/10 backdrop-blur-md border border-white/20 scale-100' : 'bg-transparent scale-90'
        }`} 
      />
      
      {/* Lines container - right aligned */}
      <div className="relative w-6 h-[18px] flex flex-col justify-between items-end">
        {/* Top line - starts short (50%) */}
        <motion.span
          initial={false}
          animate={isOpen ? { rotate: 45, y: 8, width: "100%" } : { rotate: 0, y: 0, width: "50%" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`block h-[2px] rounded-full origin-center group-hover:w-full transition-all duration-300 group-hover:bg-primary drop-shadow-sm ${useDarkText && !isOpen ? "bg-[#07130e]" : "bg-white"}`}
        />
        {/* Middle line - always full */}
        <motion.span
          initial={false}
          animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1, width: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`block w-full h-[2px] rounded-full origin-center group-hover:bg-primary transition-colors drop-shadow-sm ${useDarkText && !isOpen ? "bg-[#07130e]" : "bg-white"}`}
        />
        {/* Bottom line - starts medium (75%) */}
        <motion.span
          initial={false}
          animate={isOpen ? { rotate: -45, y: -8, width: "100%" } : { rotate: 0, y: 0, width: "75%" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`block h-[2px] rounded-full origin-center group-hover:w-full transition-all duration-300 group-hover:bg-primary drop-shadow-sm ${useDarkText && !isOpen ? "bg-[#07130e]" : "bg-white"}`}
        />
      </div>
    </button>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY >= 80);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const navItems = [
    { name: t("visitor.navbar.home"), path: "/" },
    { name: t("visitor.navbar.about"), path: "/about" },
    { name: t("visitor.navbar.activity"), path: "/activity" },
    { name: t("visitor.navbar.articles"), path: "/articles" },
    { name: t("visitor.navbar.merchandise"), path: "/merchandise" },
  ];

  const close = () => setMobileMenuOpen(false);

  const adminRoutes = ["/dashboard", "/roles", "/users", "/departments", "/activities", "/merch", "/settings"];
  const isDashboardRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/member") ||
    adminRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  if (pathname === "/login" || isDashboardRoute) return null;

  const isHome = pathname === "/";
  const isTransparentOnTop = isHome && !isScrolled;
  const shouldBeSolid = !isTransparentOnTop;

  const useDarkText = false; // always white text on green/dark navbar

  return (
    <>
      {/* Global Navigation Bar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ${
          shouldBeSolid
            ? "bg-[#0a9468]/85 dark:bg-[#0a1f18]/90 border-b border-white/15 dark:border-white/5 text-white" +
              " dark:text-white backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.15)]"
            : `bg-transparent border-b border-transparent text-white`
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center select-none cursor-pointer z-[60] relative"
            >
              <img
                src="/images/logo.png"
                alt="SRE Logo"
                className="h-10 w-auto object-contain transition-all duration-300 brightness-0 invert"
              />
            </motion.div>
          </Link>

          {/* Desktop Links Center */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive =
                pathname === item.path ||
                (pathname.startsWith(item.path) && item.path !== "/");
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className="relative text-[14px] font-medium tracking-wide transition-colors duration-300"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className={`absolute -bottom-1 left-0 right-0 h-[2px] rounded-full ${useDarkText ? "bg-[#07130e]" : "bg-white"}`}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 30,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 font-medium ${
                      isActive
                        ? useDarkText
                          ? "text-[#07130e] font-bold"
                          : "text-white font-bold"
                        : useDarkText
                          ? "text-[#07130e]/70 hover:text-[#07130e] transition-colors"
                          : "text-white/80 hover:text-white transition-colors"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA — Language toggle + Login */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="flex items-center text-[13px] font-bold tracking-wide mr-1 bg-white/15 dark:bg-black/35 rounded-full p-1 border border-white/20 dark:border-white/5 select-none shadow-inner cursor-pointer"
            >
              <span
                className={`px-3 py-1.5 rounded-full transition-all duration-300 ${
                  language === "id"
                    ? "bg-white text-amber-600 dark:bg-emerald-500 dark:text-black font-extrabold shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                ID
              </span>
              <span
                className={`px-3 py-1.5 rounded-full transition-all duration-300 ${
                  language === "en"
                    ? "bg-white text-amber-600 dark:bg-emerald-500 dark:text-black font-extrabold shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                EN
              </span>
            </button>

            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`border text-[14px] font-semibold tracking-tight rounded-full px-6 py-2.5 transition-all duration-300 flex items-center gap-2 group shadow-lg cursor-pointer ${
                  useDarkText
                    ? "border-[#07130e]/30 text-[#07130e] hover:bg-[#07130e] hover:text-white"
                    : "border-white/30 text-white hover:bg-white hover:text-[#07130e]"
                }`}
              >
                {t("visitor.navbar.login")}
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.nav>

      <div className="fixed top-0 right-6 h-20 flex items-center z-[70] md:hidden">
        <HamburgerIcon
          isOpen={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
          useDarkText={useDarkText}
        />
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop blur layer */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={close}
              className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm"
            />
            {/* Menu Panel – slides in from top with theme support */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed inset-0 z-50 md:hidden h-[100dvh] flex flex-col justify-between px-7 pt-20 pb-6 overflow-y-auto min-h-0 relative overflow-hidden transition-colors duration-500 ${
                mounted && theme === "light"
                  ? "bg-[#0bb37e] text-white"
                  : "bg-[#07130e] text-white"
              }`}
              style={{
                background:
                  mounted && theme === "light"
                    ? "linear-gradient(160deg, #0bb37e 0%, #0aa373 50%, #099c6d 100%)"
                    : "linear-gradient(160deg, #091c15 0%, #06130d 50%, #0a1f18 100%)",
              }}
            >
              {/* Glowing Background Ambient Orbs */}
              <div
                className={`absolute top-1/4 -left-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${
                  mounted && theme === "light"
                    ? "bg-yellow-300/30"
                    : "bg-emerald-500/15"
                }`}
              />
              <div
                className={`absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${
                  mounted && theme === "light"
                    ? "bg-yellow-400/20"
                    : "bg-teal-400/10"
                }`}
              />

              {/* Main Content Container */}
              <div className="my-auto flex flex-col justify-center w-full px-2 relative z-10 py-2">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className={`flex items-center justify-between mb-4 sm:mb-6 pb-2 border-b transition-colors duration-500 ${
                    mounted && theme === "light"
                      ? "border-white/20"
                      : "border-white/10"
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold tracking-[0.25em] uppercase transition-colors duration-500 ${
                      mounted && theme === "light"
                        ? "text-yellow-300"
                        : "text-emerald-400"
                    }`}
                  >
                    {t("visitor.navbar.nav_menu")}
                  </span>
                  <span
                    className={`text-[10px] font-mono transition-colors duration-500 ${
                      mounted && theme === "light"
                        ? "text-emerald-900/40"
                        : "text-white/40"
                    }`}
                  >
                    SRE SC UPNVJT
                  </span>
                </motion.div>

                {/* Primary Links */}
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item, i) => {
                    const isActive =
                      pathname === item.path ||
                      (pathname.startsWith(item.path) && item.path !== "/");
                    const isLight = mounted && theme === "light";
                    return (
                      <Link key={item.name} href={item.path} onClick={close}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.12 + i * 0.08,
                            duration: 0.45,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className={`group flex items-center justify-between py-1.5 transition-all cursor-pointer ${
                            isActive
                              ? isLight
                                ? "text-yellow-300 font-bold"
                                : "text-emerald-400 font-bold"
                              : isLight
                                ? "text-white/80 hover:text-yellow-300"
                                : "text-white/70 hover:text-emerald-400"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-xs font-mono transition-colors ${
                                isLight
                                  ? "text-yellow-300/60 group-hover:text-yellow-300"
                                  : "text-emerald-500/60 group-hover:text-emerald-400"
                              }`}
                            >
                              0{i + 1}
                            </span>
                            <span className="text-[26px] xs:text-[30px] sm:text-[36px] font-display font-black uppercase tracking-tight leading-none group-hover:translate-x-2 transition-transform duration-300">
                              {item.name}
                            </span>
                          </div>

                          {isActive ? (
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isLight
                                  ? "bg-yellow-300 shadow-[0_0_12px_#f59e0b]"
                                  : "bg-emerald-400 shadow-[0_0_12px_#34d399]"
                              }`}
                            />
                          ) : (
                            <ArrowUpRight
                              className={`w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 ${
                                isLight ? "text-yellow-300" : "text-emerald-400"
                              }`}
                            />
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Actions Row: Login CTA + Mobile Language Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.15 + navItems.length * 0.08,
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="mt-6 flex items-center gap-3"
                >
                  <Link
                    href="/login"
                    onClick={close}
                    className={`flex-1 inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full text-[14px] font-bold tracking-widest uppercase transition-all active:scale-95 ${
                      mounted && theme === "light"
                        ? "bg-yellow-300 text-slate-950 hover:bg-white shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                        : "bg-emerald-400 text-[#07130e] hover:bg-white shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {t("visitor.navbar.login")}
                  </Link>

                  <button
                    onClick={() => setLanguage(language === "id" ? "en" : "id")}
                    className="flex items-center bg-white/10 border border-white/25 rounded-full p-1 shrink-0 h-12 select-none cursor-pointer"
                  >
                    <span
                      className={`px-4 h-full flex items-center rounded-full text-xs font-black transition-all duration-300 ${
                        language === "id"
                          ? (mounted && theme === "light" 
                              ? "bg-yellow-300 text-slate-950 shadow-md"
                              : "bg-emerald-400 text-[#07130e] shadow-md")
                          : "text-white/80"
                      }`}
                    >
                      ID
                    </span>
                    <span
                      className={`px-4 h-full flex items-center rounded-full text-xs font-black transition-all duration-300 ${
                        language === "en"
                          ? (mounted && theme === "light" 
                              ? "bg-yellow-300 text-slate-950 shadow-md"
                              : "bg-emerald-400 text-[#07130e] shadow-md")
                          : "text-white/80"
                      }`}
                    >
                      EN
                    </span>
                  </button>
                </motion.div>
              </div>

              {/* Footer Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className={`mt-auto shrink-0 flex justify-between items-end text-[11px] sm:text-[12px] px-2 relative z-10 pt-4 border-t transition-colors duration-500 ${
                  mounted && theme === "light"
                    ? "border-white/20 text-white/70"
                    : "border-white/10 text-white/50"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                        mounted && theme === "light"
                          ? "bg-yellow-300 shadow-[0_0_8px_#f59e0b]"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        mounted && theme === "light"
                          ? "text-white"
                          : "text-white"
                      }`}
                    >
                      Society of Renewable Energy
                    </span>
                  </div>
                  <span
                    className={
                      mounted && theme === "light"
                        ? "text-white/70"
                        : "text-white/50"
                    }
                  >
                    UPN Veteran Jawa Timur
                  </span>
                </div>

                <div className="flex gap-4 font-bold tracking-wide">
                  <a
                    href="https://www.instagram.com/sre.upnjatim/"
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-1.5 transition-colors p-1 ${
                      mounted && theme === "light"
                        ? "hover:text-yellow-300 text-white/80"
                        : "hover:text-emerald-400 text-white/70"
                    }`}
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Instagram</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/sreupnjatim/"
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-1.5 transition-colors p-1 ${
                      mounted && theme === "light"
                        ? "hover:text-yellow-300 text-white/80"
                        : "hover:text-emerald-400 text-white/70"
                    }`}
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">LinkedIn</span>
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
