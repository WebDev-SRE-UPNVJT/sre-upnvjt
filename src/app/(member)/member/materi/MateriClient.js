"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Layers, ChevronRight, ChevronLeft, ArrowLeft, 
  ExternalLink, FileText, AlertCircle, HelpCircle, Star, BookOpen
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function MateriClient({ initialModules }) {
  const { t } = useLanguage();
  const [modules] = useState(initialModules || []);
  const [activeModule, setActiveModule] = useState(null); // module details with slides
  const [slides, setSlides] = useState([]);
  const router = useRouter();

  const handleOpenModule = (mod) => {
    router.push(`/member/materi/${mod.id}`);
  };

  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const map = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sre_materi_progress_')) {
          try {
            const moduleId = key.replace('sre_materi_progress_', '');
            const data = JSON.parse(localStorage.getItem(key));
            map[moduleId] = data;
          } catch (e) {}
        }
      }
      setProgressMap(map);
    }
  }, []);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Kemarin';
    return `${diffDays} hari lalu`;
  };

  return (
    <div className="w-full relative select-none">
      
      {/* Glow Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="mb-10">
        <span className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-wide uppercase">
          Re-mind
        </span>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white mt-4 flex items-center gap-3">
          <Presentation className="w-9 h-9 text-primary animate-pulse" />
          {t('materi.title')}
        </h1>
        <p className="text-slate-600 dark:text-white/50 max-w-xl font-medium text-sm mt-2 leading-relaxed">
          {t('materi.subtitle')}
        </p>
      </div>

      {modules.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-[#08120e] border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-white/10 mb-4 animate-pulse" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{t('materi.empty_title')}</h3>
          <p className="text-slate-500 dark:text-white/40 text-xs max-w-xs leading-relaxed mt-1">{t('materi.empty_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((mod, index) => {
            const userProg = progressMap[mod.id];
            const hasProgress = !!userProg;
            const slideCount = mod.slideCount || 1;
            let pct = 0;
            if (hasProgress) {
              pct = slideCount > 1
                ? Math.round((userProg.currentSlideIdx / (slideCount - 1)) * 100)
                : (userProg.currentSlideIdx >= 0 ? 100 : 0);
            }
            pct = Math.min(100, Math.max(0, pct));
            const timeAgoText = hasProgress ? formatTimeAgo(userProg.lastAccessed) : null;

            return (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: (index % 4) * 0.1 }}
                key={mod.id}
                onClick={() => handleOpenModule(mod)}
                className="relative bg-white/95 dark:bg-[#07130e]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[2rem] overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all duration-500 transform-gpu hover:-translate-y-2 flex flex-col h-full shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.2)]"
              >
                {/* Cover Banner */}
                <div className="relative aspect-[16/10] w-full overflow-hidden shrink-0 bg-slate-900/60">
                  {mod.coverImageUrl ? (
                    <img
                      src={resolveImageUrl(mod.coverImageUrl)}
                      alt={mod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-emerald-400/40 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950">
                      <Presentation className="w-14 h-14 animate-pulse" />
                    </div>
                  )}
                  
                  {/* Sleek Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-[#07130e] dark:via-[#07130e]/60 dark:to-transparent" />

                  {/* Slide Count Badge */}
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/90 border border-emerald-300/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] backdrop-blur-md">
                      <Layers className="w-3.5 h-3.5" />
                      {mod.slideCount || 0} HALAMAN
                    </span>
                  </div>
                </div>

                {/* Title & Desc */}
                <div className="p-6 flex-1 flex flex-col justify-between z-10 bg-white/95 dark:bg-[#07130e]/95 -mt-2">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg md:text-xl line-clamp-2 mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300 leading-snug tracking-tight">
                      {mod.title}
                    </h3>
                    {mod.description ? (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 line-clamp-2 leading-relaxed font-medium">
                        {mod.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-white/30 italic">{t('materi.no_description')}</p>
                    )}
                  </div>
                  
                  {/* Progress & Footer */}
                  <div className="mt-7 flex flex-col gap-4">
                    {/* Always Visible Progress Bar */}
                    <div className="w-full">
                      <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-white/45">
                          {hasProgress ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>{timeAgoText || "Pernah dibuka"}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20" />
                              <span>Belum Dibuka</span>
                            </>
                          )}
                        </span>
                        <span className={`font-black font-mono ${pct === 100 ? "text-emerald-500 dark:text-emerald-400" : pct > 0 ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-white/30"}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5 relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            pct === 100
                              ? "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                              : pct > 0
                              ? "bg-gradient-to-r from-amber-400 to-emerald-400"
                              : "bg-transparent"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/8">
                      <div className="flex items-center gap-2 text-slate-400 dark:text-white/40">
                        <Presentation className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('materi.open_module')}</span>
                      </div>
                      
                      <div className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400 group-hover:text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 shadow-md group-hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] group-hover:scale-[1.03]">
                        <span>{pct > 0 ? "Lanjutkan" : t('materi.view_slides')}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
