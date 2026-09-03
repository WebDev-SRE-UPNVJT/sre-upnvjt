"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ClipboardCheck, BookOpen, Clock, FileText, ArrowRight, ShieldCheck, Fingerprint, Zap, Link as LinkIcon
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function StaffDashboardClient({
  user,
  presentCount = 0,
  latestLiterature
}) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const firstName = user?.name?.split(" ")[0] ?? "Staff";
  const fullName = user?.name ?? "Staff";

  return (
    <div className="w-full relative space-y-8 select-none transition-colors duration-500 pb-20">
      
      {/* Background Ambience - Gamified Colors */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      
      {/* Hero Section with Virtual ID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl dark:shadow-2xl transition-colors duration-500"
        >
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-[50px] pointer-events-none" />
          
          <div className="relative z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 tracking-wide">
              {t('staff_dashboard.portal')}
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white mt-6 leading-none">
              {t('staff_dashboard.welcome')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-400">
                <span className="inline md:hidden">{firstName}!</span>
                <span className="hidden md:inline">{fullName}!</span>
              </span>
            </h1>
            <p className="text-slate-500 dark:text-white/60 text-sm md:text-base font-medium mt-3 max-w-lg leading-relaxed">
              {t('staff_dashboard.desc')}
            </p>
          </div>
        </motion.div>

        {/* Ultra-Premium Physical-style ID Card (Remains purely dark/black for both modes) */}
        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }} className="w-full md:w-[380px] perspective h-[220px] group">
          <div className="w-full h-full relative transition-all duration-1000 ease-[0.22,1,0.36,1] transform-gpu group-hover:rotate-y-12 group-hover:-rotate-x-4 shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[20px]">
            
            {/* Card Physical Body */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-[#111111] to-[#151515] rounded-[20px] border border-black/20 dark:border-white/[0.08] overflow-hidden">
              
              {/* Physical Texture */}
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />
              
              {/* Metal Glare on Hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1.5s] ease-[0.22,1,0.36,1]" />

              {/* Subdued Debossed SRE Logo */}
              <div className="absolute -right-4 -bottom-6 text-[8rem] font-black tracking-tighter text-black/40 select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.03)]">
                SRE
              </div>

              <div className="relative h-full flex flex-col justify-between p-6">
                
                {/* Top Bar: Logo & Org */}
                <div className="flex justify-between items-start">
                  {/* SRE Logo */}
                  <div className="w-24 h-10 relative ml-1 mt-1">
                    <img src="/images/logo.webp" alt="SRE Logo" className="w-full h-full object-contain object-left scale-[1.6] origin-left opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                  </div>
                  
                  <div className="text-right pt-1">
                    <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/30 mb-0.5">Organization</p>
                    <p className="text-xs font-bold tracking-widest text-white/80">{t('staff_dashboard.org')}</p>
                  </div>
                </div>

                {/* Bottom: Profile & Details */}
                <div className="flex items-end gap-4 mt-auto">
                  <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden shrink-0 shadow-lg">
                    {user?.profilePictureUrl || user?.image ? (
                      <img src={user.profilePictureUrl || user.image} alt="" className="w-full h-full object-cover grayscale opacity-90 mix-blend-luminosity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-medium text-lg text-white/50">
                        {user?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pb-1">
                    <h4 className="text-lg font-bold text-white/95 truncate tracking-tight">{user?.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] text-emerald-400 font-mono tracking-widest uppercase">
                        {t('staff_dashboard.npm')} {user?.npm || "-"}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Gamified Stat/Action Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {/* Shortcut to Documents (Indigo Gamified) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/officer/dokumen" className="block h-full">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-full bg-white/80 dark:bg-[#08120e]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-none transition-all duration-500 group-hover:border-emerald-500/30">
                <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <FileText className="w-40 h-40 text-emerald-500" />
                </div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                    <FileText className="w-8 h-8" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 dark:text-white/20 group-hover:text-emerald-500 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{t('staff_dashboard.arsip_dokumen')}</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-white/40 mt-1">{t('staff_dashboard.arsip_dokumen_desc')}</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Shortcut to Literatur (Teal Gamified) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link href="/officer/literatur" className="block h-full">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-full bg-white/80 dark:bg-[#08120e]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-none transition-all duration-500 group-hover:border-emerald-500/30">
                <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <BookOpen className="w-40 h-40 text-emerald-500" />
                </div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 dark:text-white/20 group-hover:text-emerald-500 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{t('staff_dashboard.bank_literatur')}</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-white/40 mt-1">{t('staff_dashboard.bank_literatur_desc')}</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Shortcut to SRE Links (Emerald Gamified) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link href="/officer/links" className="block h-full">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-full bg-white/80 dark:bg-[#08120e]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-none transition-all duration-500 group-hover:border-emerald-500/30">
                <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <LinkIcon className="w-40 h-40 text-emerald-500" />
                </div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                    <LinkIcon className="w-8 h-8" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 dark:text-white/20 group-hover:text-emerald-500 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{t('staff_dashboard.sre_links')}</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-white/40 mt-1">{t('staff_dashboard.sre_links_desc')}</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

      </div>

      <div className="mt-6">
        {/* Latest Literature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white/60 dark:bg-[#08120e]/60 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative shadow-xl dark:shadow-none"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Zap className="w-5 h-5" /></div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{t('staff_dashboard.latest_lit')}</h3>
          </div>
          
          {latestLiterature && latestLiterature.length > 0 ? (
            <div className="flex flex-col gap-3">
              {latestLiterature.map((lit) => (
                <Link key={lit.id} href={`/officer/literatur/${lit.id}`} className="block">
                  <div className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-emerald-500/50 transition-colors h-full">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate mb-1 group-hover:text-emerald-500 transition-colors">{lit.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-white/50 mb-3">{t('staff_dashboard.by')} {lit.author}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-md">
                        Tahun Terbit: {lit.year || "Tidak diketahui"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(lit.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              {t('staff_dashboard.empty_lit')}
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
