"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Presentation, FolderOpen, FolderKanban,
  Target, Trophy, ClipboardCheck, User, LogOut, Menu, X, Zap, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Materi", href: "/member/materi", icon: Presentation },
  { name: "Bank Literatur", href: "/member/literatur", icon: FolderOpen },
  { name: "Tugas", href: "/member/tugas", icon: FolderKanban },
  { name: "Quiz", href: "/member/quiz", icon: Target },
  { name: "Leaderboard", href: "/member/leaderboard", icon: Trophy },
  { name: "Presensi", href: "/member/absensi", icon: ClipboardCheck },
  { name: "Profil", href: "/member/profil", icon: User },
];

export default function MemberSidebarClient({ user, profile }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const xp = profile.xp || 0;
  const level = profile.level || 1;
  const levelProgress = xp % 100;

  // Level name classification
  let levelTitle = "Seedling";
  if (level >= 6 && level <= 15) levelTitle = "Sapling";
  else if (level >= 16 && level <= 30) levelTitle = "Tree";
  else if (level >= 31) levelTitle = "Forest";

  const renderProgress = () => (
    <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex justify-between items-center mb-2 relative z-10">
        <span className="text-xs font-bold text-gray-400">Level {level}</span>
        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">{levelTitle}</span>
      </div>
      <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mb-1.5 relative z-10 border border-white/5">
        <div
          className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${levelProgress}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold relative z-10">
        <span>{levelProgress} / 100 XP</span>
        <span>Total: {xp} XP</span>
      </div>
    </div>
  );

  const renderLogo = () => (
    <div className="flex items-center justify-between mb-8 shrink-0">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="h-10 w-24 bg-primary dark:bg-white" style={{ WebkitMaskImage: "url(/images/logo.webp)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "left center", maskImage: "url(/images/logo.webp)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "left center" }} />
      </Link>
      <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  );

  const renderNavLinks = () => (
    <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
      {SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border ${
              isActive
                ? "bg-primary text-[#050e0a] border-primary shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                : "bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#050e0a] z-40 shrink-0">
        <div className="h-8 w-20 bg-primary" style={{ WebkitMaskImage: "url(/images/logo.webp)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", maskImage: "url(/images/logo.webp)", maskSize: "contain", maskRepeat: "no-repeat" }} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded">
            <Zap className="w-3 h-3" />
            <span>{xp} XP</span>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#050e0a] border-r border-white/5 p-6 flex flex-col transform transition-transform duration-300 lg:static lg:transform-none lg:w-80 shrink-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {renderLogo()}

        {/* Member Profile Widget */}
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/5">
          <div className="min-w-0">
            <div className="text-[15px] font-black text-white leading-tight truncate">{user?.name}</div>
            <div className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</div>
          </div>
          {renderProgress()}
        </div>

        {/* Sidebar Nav */}
        {renderNavLinks()}

        {/* Theme Toggle & Logout */}
        <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-2">
            <ThemeToggle />
            <span className="text-xs font-medium text-gray-400">Tema Tampilan</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold border border-transparent text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </>
  );
}
