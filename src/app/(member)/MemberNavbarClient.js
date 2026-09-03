"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { 
  BookOpen, Trophy, ClipboardCheck, FolderKanban, Menu, X, 
  ChevronDown, LogOut, Bell, User, Star, Settings, Award, Globe, Moon, Sun
} from "lucide-react";
import { getUserLevelData } from "@/lib/leveling";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function MemberNavbarClient({ user, profile }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [academicDropdownOpen, setAcademicDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const academicRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (academicRef.current && !academicRef.current.contains(event.target)) {
        setAcademicDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on path changes
  useEffect(() => {
    setIsOpen(false);
    setAcademicDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: t("member_nav.home") || "Beranda", href: "/member" },
    { name: t("member_nav.tasks") || "Tugas", href: "/member/tugas", icon: FolderKanban },
    { name: t("member_nav.leaderboard") || "Leaderboard", href: "/member/leaderboard", icon: Trophy },
    { name: t("member_nav.attendance") || "Presensi", href: "/member/absensi", icon: ClipboardCheck },
  ];

  const levelData = getUserLevelData(profile?.xp || user?.totalPoints || 0);

  // Hide Navbar completely on the Quiz Taking page for fullscreen Quizizz experience
  const isTakingQuiz = pathname.match(/^\/member\/quiz\/\d+$/);
  if (isTakingQuiz) return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-[#07130e]/80 border-b border-slate-200 dark:border-white/5 backdrop-blur-md shadow-xl"
            : "bg-white/40 dark:bg-[#07130e]/40 border-b border-transparent backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/member" className="flex items-center gap-2 group">
                <div
                  className="h-12 w-36 bg-primary dark:bg-white transition-all duration-300"
                  style={{
                    WebkitMaskImage: "url(/images/logo.webp)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "left center",
                    maskImage: "url(/images/logo.webp)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "left center",
                  }}
                />
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/25 text-primary font-bold px-2 py-0.5 rounded-md">
                  Member
                </span>
              </Link>
            </div>

            {/* Center Navigation Links (Desktop) */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Beranda Link */}
              <Link
                href="/member"
                className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${
                  pathname === "/member"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                {t("member_nav.home") || "Beranda"}
              </Link>

              {/* Academic Dropdown */}
              <div className="relative" ref={academicRef}>
                <button
                  onClick={() => setAcademicDropdownOpen(!academicDropdownOpen)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border ${
                    pathname.startsWith("/member/literatur") ||
                    pathname.startsWith("/member/materi")
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border-transparent"
                  }`}
                >
                  {t("member_nav.academic") || "Akademik"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${academicDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {academicDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 shadow-2xl p-2 z-[60] overflow-hidden"
                    >
                      <Link
                        href="/member/literatur"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                          pathname.startsWith("/member/literatur")
                            ? "bg-primary/20 text-primary"
                            : "text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        {t("member_nav.literature") || "Bank Literatur"}
                      </Link>
                      <Link
                        href="/member/quiz"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                          pathname.startsWith("/member/quiz")
                            ? "bg-primary/20 text-primary"
                            : "text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        {t("member_nav.quiz") || "Quiz"}
                      </Link>
                      <Link
                        href="/member/materi"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                          pathname.startsWith("/member/materi")
                            ? "bg-primary/20 text-primary"
                            : "text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <FolderKanban className="w-4 h-4" />
                        {t("member_nav.material") || "Materi"}
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other links */}
              {navLinks.slice(1).map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Section (Desktop) */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Language Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setLanguage(language === "id" ? "en" : "id")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors text-xs font-bold"
              >
                <Globe className="w-4 h-4" />
                {language.toUpperCase()}
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors"
              >
                {!mounted ? null : theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </motion.button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl pl-3 pr-4 py-1.5 text-left transition-all"
                >
                  {user?.profilePictureUrl || user?.image ? (
                    <img
                      src={user.profilePictureUrl || user.image}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-sm text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="max-w-[100px]">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {user?.name?.split(" ")[0]}
                    </p>
                    <p className="text-[9px] font-bold text-primary tracking-wide">
                      Lv. {levelData.currentLevel} {levelData.levelName}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-white/50" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 rounded-3xl bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 shadow-2xl p-4 z-[60] overflow-hidden"
                    >
                      {/* User summary details */}
                      <div className="pb-4 mb-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
                        {user?.profilePictureUrl || user?.image ? (
                          <img
                            src={user.profilePictureUrl || user.image}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-lg text-primary">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">
                            {user?.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-white/40 truncate w-40">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      {/* XP Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-white/60">
                          <span>XP: {levelData.totalXp}</span>
                          <span>Lvl {levelData.currentLevel}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                            style={{
                              width: `${levelData.progressPercentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex flex-col gap-1 mb-4">
                        <Link
                          href="/member/profil"
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                          <User className="w-4 h-4 text-primary" />
                          Detail Profil
                        </Link>
                      </div>

                      {/* Sign out */}
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-red-400 bg-red-500/10 border border-red-500/15 hover:bg-red-500/25 font-bold transition-all text-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Hamburger menu button (Mobile) */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Language Toggle (Mobile) */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setLanguage(language === "id" ? "en" : "id")}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/5 font-bold text-xs"
              >
                <Globe className="w-4 h-4" />
                <span>{language.toUpperCase()}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors"
              >
                {!mounted ? null : theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </motion.button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/5"
              >
                {isOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer menu - Placed outside nav for correct z-index stacking */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 h-[100dvh] w-[85%] sm:w-80 bg-white dark:bg-[#07130e] border-l border-slate-200 dark:border-white/5 shadow-2xl z-[100] overflow-y-auto flex flex-col"
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
                <span className="text-sm font-black text-slate-400 dark:text-white/50 tracking-widest uppercase">
                  {t("member_nav.home") ? (language === "en" ? "Main Menu" : "Menu Utama") : "Menu Utama"}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 px-4 py-6 flex flex-col gap-2">
                <Link
                  href="/member"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all ${
                    pathname === "/member"
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Award
                    className={`w-5 h-5 ${pathname === "/member" ? "text-primary" : "text-slate-400 dark:text-white/40"}`}
                  />
                  {t("member_nav.home") || "Beranda"}
                </Link>

                <div className="mt-4 mb-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                  {t("member_nav.academic") || "Akademik"}
                </div>

                <Link
                  href="/member/literatur"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all ${
                    pathname.startsWith("/member/literatur")
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <BookOpen
                    className={`w-5 h-5 ${pathname.startsWith("/member/literatur") ? "text-primary" : "text-slate-400 dark:text-white/40"}`}
                  />
                  {t("member_nav.literature") || "Bank Literatur"}
                </Link>

                <Link
                  href="/member/materi"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all ${
                    pathname.startsWith("/member/materi")
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FolderKanban
                    className={`w-5 h-5 ${pathname.startsWith("/member/materi") ? "text-primary" : "text-slate-400 dark:text-white/40"}`}
                  />
                  {t("member_nav.material") || "Materi"}
                </Link>

                <Link
                  href="/member/quiz"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all ${
                    pathname.startsWith("/member/quiz")
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Award
                    className={`w-5 h-5 ${pathname.startsWith("/member/quiz") ? "text-primary" : "text-slate-400 dark:text-white/40"}`}
                  />
                  {t("member_nav.quiz") || "Quiz"}
                </Link>

                <div className="mt-4 mb-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                  {language === "en" ? "Activities" : "Aktivitas"}
                </div>

                {navLinks.slice(1).map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400 dark:text-white/40"}`}
                        />
                      )}
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {/* User settings details (Bottom pinned) */}
              <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-6">
                  {user?.profilePictureUrl || user?.image ? (
                    <img
                      src={user.profilePictureUrl || user.image}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-sm text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {user?.name}
                    </h4>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5">
                      Level {levelData.currentLevel} • {levelData.levelName}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/member/profil"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 transition-all"
                  >
                    <User className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Profil
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
