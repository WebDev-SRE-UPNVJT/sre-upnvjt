"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Layers, ChevronRight, ChevronLeft, ArrowLeft, 
  ExternalLink, FileText, AlertCircle, HelpCircle, Star, BookOpen
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";

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
          {modules.map((mod, index) => (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: (index % 4) * 0.1 }}
              key={mod.id}
              onClick={() => handleOpenModule(mod)}
              className="relative bg-white dark:bg-[#090d14] border border-slate-200/60 dark:border-white/5 rounded-3xl overflow-hidden cursor-pointer group hover:border-emerald-500/30 transition-all duration-500 transform-gpu hover:-translate-y-2 flex flex-col h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(16,185,129,0.1)]"
            >
              {/* Cover Banner (Keeping it but blending it into the dark theme) */}
              <div className="relative aspect-[16/9] w-full overflow-hidden shrink-0 bg-slate-100 dark:bg-[#090d14]">
                {mod.coverImageUrl ? (
                  <img
                    src={mod.coverImageUrl}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 dark:opacity-70 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500/20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-[#090d14]">
                    <Presentation className="w-14 h-14" />
                  </div>
                )}
                
                {/* Sleek Gradient Overlay for Text Readability & Seamless Blend */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/0 to-transparent dark:from-[#090d14] dark:from-[5%] dark:via-[#090d14]/80 dark:via-[35%] dark:to-transparent" />

                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/90 border border-emerald-400/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-md">
                    <Layers className="w-3.5 h-3.5" />
                    {mod.slideCount || 0} {t('materi.file_count')}
                  </span>
                </div>
              </div>

              {/* Title & Desc */}
              <div className="p-6 flex-1 flex flex-col justify-between z-10 bg-white dark:bg-[#090d14] -mt-[1px]">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xl line-clamp-2 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 leading-snug tracking-tight">
                    {mod.title}
                  </h3>
                  {mod.description ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">{t('materi.no_description')}</p>
                  )}
                </div>
                
                {/* Progress & Footer */}
                <div className="mt-8 flex flex-col gap-5">
                  
                  {progressMap[mod.id] && (
                    <div className="w-full">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {formatTimeAgo(progressMap[mod.id].lastAccessed) || 'Pernah dibuka'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          {(mod.slideCount || 1) > 1 ? Math.round((progressMap[mod.id].currentSlideIdx / ((mod.slideCount || 1) - 1)) * 100) : (progressMap[mod.id].currentSlideIdx >= 0 ? 100 : 0)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(mod.slideCount || 1) > 1 ? (progressMap[mod.id].currentSlideIdx / ((mod.slideCount || 1) - 1)) * 100 : (progressMap[mod.id].currentSlideIdx >= 0 ? 100 : 0)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Presentation className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{t('materi.open_module')}</span>
                    </div>
                    
                    <div className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 text-white dark:text-slate-900 group-hover:text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 shadow-sm group-hover:shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
                      {progressMap[mod.id] ? 'Lanjutkan' : t('materi.view_slides')} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
