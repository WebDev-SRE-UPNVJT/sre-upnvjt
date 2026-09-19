"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Layers, ChevronRight, ChevronLeft, ArrowLeft, 
  ExternalLink, FileText, AlertCircle, HelpCircle, Star, BookOpen, Search
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function MateriClient({ initialModules = [], initialPhases = [], initialProgressMap = {} }) {
  const { t } = useLanguage();
  const [modules] = useState(initialModules || []);
  const [phases] = useState(initialPhases || []);
  const [selectedPhase, setSelectedPhase] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleOpenModule = (mod) => {
    router.push(`/member/materi/${mod.id}`);
  };

  const [progressMap, setProgressMap] = useState(initialProgressMap || {});

  useEffect(() => {
    if (initialProgressMap) {
      setProgressMap(initialProgressMap);
    }
  }, [initialProgressMap]);

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

  // Filter modules by search and phase
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const matchesSearch =
        (mod.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mod.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mod.phaseName || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedPhase === "ALL") return true;
      if (selectedPhase === "NONE") return !mod.phaseId;
      return String(mod.phaseId) === String(selectedPhase);
    });
  }, [modules, searchQuery, selectedPhase]);

  return (
    <div className="w-full relative select-none">
      
      {/* Glow Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
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

        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
          <input
            type="text"
            placeholder="Cari materi pembelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-primary/50 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Phase Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
        <button
          onClick={() => setSelectedPhase("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
            selectedPhase === "ALL"
              ? "bg-emerald-500 text-slate-950 font-black shadow-emerald-500/20"
              : "bg-white dark:bg-[#07130e] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
          }`}
        >
          <span>Semua Fase</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${selectedPhase === "ALL" ? "bg-black/15 text-black" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50"}`}>
            {modules.length}
          </span>
        </button>

        {phases.map((p) => {
          const countInPhase = modules.filter(m => String(m.phaseId) === String(p.id)).length;
          const isSelected = String(selectedPhase) === String(p.id);

          return (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(String(p.id))}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
                isSelected
                  ? "bg-emerald-500 text-slate-950 font-black shadow-emerald-500/20"
                  : "bg-white dark:bg-[#07130e] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
              }`}
            >
              <span>{p.name}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isSelected ? "bg-black/15 text-black" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50"}`}>
                {countInPhase}
              </span>
            </button>
          );
        })}

        {modules.some(m => !m.phaseId) && (
          <button
            onClick={() => setSelectedPhase("NONE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
              selectedPhase === "NONE"
                ? "bg-emerald-500 text-slate-950 font-black shadow-emerald-500/20"
                : "bg-white dark:bg-[#07130e] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
            }`}
          >
            <span>Tanpa Fase</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${selectedPhase === "NONE" ? "bg-black/15 text-black" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50"}`}>
              {modules.filter(m => !m.phaseId).length}
            </span>
          </button>
        )}
      </div>

      {filteredModules.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-[#08120e] border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-white/10 mb-4 animate-pulse" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
            {searchQuery || selectedPhase !== "ALL" ? "Materi Tidak Ditemukan" : t('materi.empty_title')}
          </h3>
          <p className="text-slate-500 dark:text-white/40 text-xs max-w-xs leading-relaxed mt-1">
            {searchQuery || selectedPhase !== "ALL"
              ? "Tidak ada materi yang sesuai dengan kata kunci atau fase yang dipilih."
              : t('materi.empty_desc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModules.map((mod, index) => {
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
                className="relative bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all duration-300 transform-gpu hover:-translate-y-1 flex flex-col h-full shadow-sm hover:shadow-md"
              >
                  {/* Cover Banner */}
                <div className="relative aspect-[16/10] w-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                  {mod.coverImageUrl ? (
                    <img
                      src={resolveImageUrl(mod.coverImageUrl)}
                      alt={mod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20 bg-slate-100 dark:bg-slate-900">
                      <Presentation className="w-12 h-12 opacity-60" />
                    </div>
                  )}

                  {/* Phase Badge */}
                  {mod.phaseName && (
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 text-slate-200 backdrop-blur-md truncate max-w-[130px]" title={mod.phaseName}>
                        {mod.phaseName}
                      </span>
                    </div>
                  )}

                  {/* Slide Count Badge */}
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-slate-200 backdrop-blur-md">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      {mod.slideCount || 0} HALAMAN
                    </span>
                  </div>
                </div>

                {/* Title & Desc */}
                <div className="p-5 flex-1 flex flex-col justify-between z-10 bg-white dark:bg-[#07130e]">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base md:text-lg line-clamp-2 mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200 leading-snug">
                      {mod.title}
                    </h3>
                    {mod.description ? (
                      <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-2 leading-relaxed font-medium">
                        {mod.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-white/30 italic">{t('materi.no_description')}</p>
                    )}
                  </div>
                  
                  {/* Progress & Footer */}
                  <div className="mt-5 flex flex-col gap-3.5">
                    {/* Always Visible Progress Bar */}
                    <div className="w-full">
                      <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-white/45">
                          {hasProgress ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>{timeAgoText || "Pernah dibuka"}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20" />
                              <span>Belum Dibuka</span>
                            </>
                          )}
                        </span>
                        <span className={`font-black font-mono ${pct === 100 ? "text-emerald-500 dark:text-emerald-400" : pct > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-white/30"}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full ${pct > 0 ? "bg-emerald-500" : "bg-transparent"}`}
                        />
                      </div>
                    </div>

                    {/* Single Action Button */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/8">
                      <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm">
                        <span>{pct > 0 ? "Lanjutkan" : (t('materi.view_slides') || "Buka Materi")}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
