"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Sparkles, Filter, Activity as ActivityIcon, ArrowUpRight, Tag, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "next-themes";
import Link from "next/link";

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://cdn.webly.biz.id/";
  return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

export default function ActivityPublicClient({ activities = [] }) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const now = new Date();
  
  // Separate upcoming and past activities
  const upcomingActivities = activities
    .filter(a => new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Closest upcoming first

  const pastActivities = activities
    .filter(a => new Date(a.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent past first

  const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first

  const priorityActivities = activities
    .filter(a => a.isPriority)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent priority first

  let featuredActivity = null;
  let isUpcomingFeatured = false;

  if (priorityActivities.length > 0) {
    featuredActivity = priorityActivities[0];
    isUpcomingFeatured = new Date(featuredActivity.date) >= now;
  } else if (upcomingActivities.length > 0) {
    featuredActivity = upcomingActivities[0];
    isUpcomingFeatured = true;
  } else if (sortedActivities.length > 0) {
    featuredActivity = sortedActivities[0];
    isUpcomingFeatured = false;
  }

  // Filter activities by real-time search query
  const filterFn = (a) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (a.name || "").toLowerCase().includes(query) ||
      (a.description || "").toLowerCase().includes(query) ||
      (a.location || "").toLowerCase().includes(query) ||
      (a.type || "").toLowerCase().includes(query)
    );
  };

  const filteredUpcoming = upcomingActivities.filter(filterFn);
  const filteredPast = pastActivities.filter(filterFn);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getEventDateParts = (dateStr) => {
    if (!dateStr) return { day: "", month: "" };
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString();
      const month = d.toLocaleDateString(language === "id" ? "id-ID" : "en-US", { month: 'short' });
      return { day, month };
    } catch {
      return { day: "", month: "" };
    }
  };

  return (
    <div className="min-h-screen bg-[#0cc48a] dark:bg-[#07130e] text-white pt-20 font-sans transition-colors duration-300">
      {/* Hero Banner */}
      <section className="relative py-20 md:py-28 px-6 md:px-12 flex items-center overflow-hidden border-b border-white/10 dark:border-transparent bg-[#0cc48a] dark:bg-[#07130e] transition-colors duration-300">
        {/* Background Image of SRE Meeting */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 md:scale-120 pointer-events-none z-0"
          style={{ backgroundImage: 'url("/images/about/sre%20first%20meet.jpg")' }}
        />
        {/* Creative Left-to-Right Fading Gradient Mask to make it distinct from the About page and remove yellow tint */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300 z-10" 
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(to right, rgba(5, 12, 9, 1.0) 0%, rgba(7, 19, 14, 0.95) 50%, rgba(7, 19, 14, 0.30) 100%)'
              : 'linear-gradient(to right, rgba(3, 34, 24, 1.0) 0%, rgba(10, 163, 115, 0.95) 50%, rgba(12, 196, 138, 0.65) 100%)'
          }}
        />

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-300/15 border border-yellow-300/30 text-yellow-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-yellow-300 dark:text-emerald-400" />
              SRE UPN VETERAN JATIM
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight uppercase leading-tight text-white mb-6">
              {t("visitor.activity.title").split(" & ")[0]} & <span className="text-yellow-300 dark:text-emerald-400">{t("visitor.activity.title").split(" & ")[1]}</span>
            </h1>

            <p className="text-lg md:text-xl text-white dark:text-gray-300 font-light leading-relaxed mb-8 max-w-2xl">
              {t("visitor.activity.subtitle")}
            </p>

            <div className="flex items-center gap-4 text-sm font-semibold text-white/80 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 dark:bg-emerald-400 animate-pulse" />
                {activities.length} {t("visitor.activity.total_act")}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Activity */}
      {featuredActivity && (
        <section className="py-16 md:py-24 px-6 md:px-12 relative overflow-hidden bg-[#0aa373] dark:bg-white/[0.01] transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-[#e8ecc4] border border-[#d0d6a8]/60 dark:bg-white/[0.02] dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-lg backdrop-blur-2xl hover:border-[#0cc48a]/40 dark:hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#0cc48a]/10 dark:bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-[#0cc48a]/20 dark:group-hover:bg-emerald-500/20 transition-all duration-500" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
                {/* Left: Featured Image */}
                <div className="lg:col-span-6 relative rounded-2xl overflow-hidden shadow-xl aspect-[16/10] bg-[#07130e]/40 dark:bg-emerald-950/40 border border-[#d0d6a8] dark:border-white/10 group-hover:scale-[1.01] transition-transform duration-500">
                  {featuredActivity.imageUrl ? (
                    <img
                      src={resolveImageUrl(featuredActivity.imageUrl)}
                      alt={featuredActivity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#07130e]/60 dark:text-gray-500 p-8 text-center bg-[#07130e]/5 dark:bg-emerald-950/20">
                      <ActivityIcon className="w-16 h-16 text-[#0cc48a]/30 dark:text-emerald-500/30 mb-3" />
                      <span className="text-xs uppercase font-bold tracking-widest text-[#0cc48a]/50 dark:text-emerald-500/50">{t("visitor.activity.no_image")}</span>
                    </div>
                  )}

                  {/* Category Pill Tag Overlay */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-black/60 text-yellow-300 dark:text-emerald-400 backdrop-blur-md border border-white/10 shadow-lg">
                      <Tag className="w-3.5 h-3.5" />
                      {featuredActivity.type || "EVENT"}
                    </span>
                  </div>
                </div>

                {/* Right: Detailed Content */}
                <div className="lg:col-span-6 flex flex-col justify-center gap-5">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${
                      isUpcomingFeatured 
                        ? "bg-amber-500/10 text-amber-800 border border-amber-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" 
                        : "bg-[#0cc48a]/10 text-[#07130e] border border-[#0cc48a]/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isUpcomingFeatured ? "bg-amber-500 dark:bg-emerald-400 animate-ping" : "bg-[#0cc48a] dark:bg-emerald-400 animate-pulse"}`} />
                      {isUpcomingFeatured ? t("visitor.activity.upcoming") : t("visitor.activity.latest")}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-display font-black text-[#07130e] dark:text-white tracking-tight leading-tight group-hover:text-[#0cc48a] dark:group-hover:text-emerald-400 transition-colors duration-300">
                    {featuredActivity.name}
                  </h2>

                  <p className="text-[#07130e]/80 dark:text-gray-300 text-sm md:text-base leading-relaxed font-normal whitespace-pre-line line-clamp-4">
                    {featuredActivity.description || t("visitor.activity.no_desc")}
                  </p>

                  {/* Metadata Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#d0d6a8] dark:border-white/10 mt-2">
                    {featuredActivity.date && (
                      <div className="flex items-center gap-3 text-sm text-[#07130e] dark:text-gray-300">
                        <div className="w-9 h-9 rounded-xl bg-[#0cc48a]/10 border border-[#0cc48a]/20 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-[#0cc48a] dark:text-emerald-400 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#07130e]/60 dark:text-gray-400 block">{t("visitor.activity.date")}</span>
                          <span className="font-semibold text-[#07130e] dark:text-white">{formatDate(featuredActivity.date)}</span>
                        </div>
                      </div>
                    )}

                    {featuredActivity.location && (
                      <div className="flex items-center gap-3 text-sm text-[#07130e] dark:text-gray-300">
                        <div className="w-9 h-9 rounded-xl bg-[#0cc48a]/10 border border-[#0cc48a]/20 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-[#0cc48a] dark:text-emerald-400 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#07130e]/60 dark:text-gray-400 block">{t("visitor.activity.location")}</span>
                          <span className="font-semibold text-[#07130e] dark:text-white truncate max-w-[180px] block">{featuredActivity.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Other Activities */}
      <section className="scroll-mt-20 py-16 md:py-24 px-6 md:px-12 relative border-t border-white/15 dark:border-transparent bg-[#08a270] dark:bg-[#050e0a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header & Category Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-black text-yellow-300 dark:text-emerald-400 tracking-widest uppercase mb-2 block">
                {t("visitor.activity.archive_title")}
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tight">
                {t("visitor.activity.our_events_prefix")}<span className="text-yellow-300 dark:text-emerald-400">{t("visitor.activity.our_events_highlight")}</span>
              </h2>
            </div>

            {/* Interactive Search Bar */}
            <div className="relative w-full md:w-80 group">
              <div className="absolute inset-0 bg-yellow-300/10 dark:bg-emerald-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "id" ? "Cari kegiatan, topik..." : "Search events, topics..."}
                className="w-full px-5 py-3 pl-12 text-sm rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 dark:focus:bg-[#07130e] dark:focus:text-white dark:focus:border-emerald-500/40 focus:ring-2 focus:ring-yellow-300 dark:focus:ring-emerald-500/30 transition-all duration-300 shadow-inner"
              />
              <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-white/50 group-focus-within:text-slate-900 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
            </div>
          </div>

          {filteredUpcoming.length === 0 && filteredPast.length === 0 ? (
            <div className="text-center py-20 bg-white/10 dark:bg-white/[0.01] border border-dashed border-white/20 dark:border-white/10 rounded-3xl">
              <ActivityIcon className="w-12 h-12 text-yellow-300/60 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">{t("visitor.activity.no_act_found")}</h3>
              <p className="text-xs text-white/70 dark:text-gray-400 max-w-sm mx-auto">
                {activities.length === 0
                  ? t("visitor.activity.no_act_db")
                  : t("visitor.activity.no_act_filter")}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* ─── SECTION 1: UPCOMING ACTIVITIES (ASPECT RATIO 4:5) ─── */}
              {filteredUpcoming.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-8 max-w-full">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 dark:bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-300 dark:bg-emerald-400"></span>
                    </span>
                    <h3 className="text-[17px] xs:text-lg sm:text-2xl font-display font-black text-white uppercase tracking-tight whitespace-nowrap">
                      {language === "id" ? "Kegiatan Mendatang" : "Upcoming Events"}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full bg-yellow-300/20 text-yellow-300 dark:bg-emerald-400/20 dark:text-emerald-300 text-[10px] sm:text-xs font-black border border-yellow-300/30 dark:border-emerald-400/30 whitespace-nowrap shrink-0">
                      {filteredUpcoming.length} {language === "id" ? "Acara" : "Events"}
                    </span>
                  </div>

                  <div className="flex overflow-x-auto pb-6 gap-5 scrollbar-none snap-x snap-mandatory flex-nowrap justify-start w-[calc(100%+1.5rem)] -mr-6 pr-6 max-w-none sm:max-w-full sm:w-full sm:mr-0 sm:pr-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6 justify-items-center">
                    {filteredUpcoming.map((act, idx) => {
                      const { day, month } = getEventDateParts(act.date);
                      const isExternal = !!act.link;
                      const href = act.link || "/activity";
                      const isRegister = act.linkType === "register";
                      
                      const buttonText = isRegister 
                        ? (language === "id" ? "Daftar" : "Register")
                        : (language === "id" ? "Detail" : "Details");

                      return (
                        <motion.div
                          key={act.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: idx * 0.06 }}
                          className={`group relative flex flex-col bg-[#058562] dark:bg-slate-950/75 border rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-500 w-[260px] sm:w-full sm:max-w-[280px] shrink-0 sm:shrink snap-center` + (
                            act.isPriority || act.isAnnouncementModal
                              ? " border-yellow-300 dark:border-emerald-400/80 shadow-[0_0_20px_rgba(253,224,71,0.2)] dark:shadow-[0_0_20px_rgba(52,211,153,0.2)] ring-1 ring-yellow-300/40 dark:ring-emerald-400/40"
                              : " border-white/20 dark:border-white/10"
                          )}
                        >
                          {/* Portrait Poster Image (Aspect Ratio 4:4 on Mobile, 4:5 on Desktop) */}
                          <div className="relative w-full aspect-[4/4] sm:aspect-[4/5] overflow-hidden flex-shrink-0 bg-slate-900/40">
                            {act.imageUrl ? (
                              <img
                                src={resolveImageUrl(act.imageUrl)}
                                alt={act.name}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-800/40 to-teal-950/60 flex flex-col items-center justify-center gap-2">
                                <Sparkles className="w-8 h-8 text-white/20" />
                                <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Poster 4:5</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                            
                            {(act.isPriority || act.isAnnouncementModal) && (
                               <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-300 dark:bg-emerald-400 text-slate-950 dark:text-[#0b120f] shadow-lg text-[9px] font-black uppercase tracking-wider">
                                 <Sparkles className="w-3 h-3 text-slate-950 dark:text-[#0b120f]" />
                                 <span>{t("visitor.home.priority_activity_badge") || "SEDANG DIBUKA"}</span>
                               </div>
                             )}

                            {/* Calendar Date Badge on Top-Right */}
                            {day && (
                              <div className="absolute top-3 right-3 z-20 flex flex-col items-center justify-center w-12 h-14 bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-100 dark:border-white/10 select-none">
                                <div className="w-full bg-red-500 dark:bg-emerald-500 text-[9px] font-black uppercase text-center py-0.5 text-white dark:text-slate-950 tracking-wider">
                                  {month}
                                </div>
                                <div className="flex-1 flex items-center justify-center text-base font-extrabold text-slate-900 dark:text-white leading-none">
                                  {day}
                                </div>
                              </div>
                            )}

                            {/* Event Tags Overlay (Category Tag + Floating Location) */}
                            <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1.5 items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/50 text-yellow-300 dark:text-emerald-400 border border-white/10 backdrop-blur-md">
                                {act.type || "EVENT"}
                              </span>
                              {act.location && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-white/15 text-white border border-white/5 backdrop-blur-md">
                                  <MapPin className="w-3 h-3 text-yellow-300 dark:text-emerald-400" />
                                  <span className="truncate max-w-[110px]">{act.location}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div className="h-[90px] sm:h-[96px] flex flex-col justify-start mb-3">
                              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-yellow-300 dark:group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2 leading-snug mb-1.5">
                                {act.name}
                              </h3>
                              <p className="text-xs text-white/80 dark:text-gray-400 font-medium leading-normal line-clamp-2">
                                {act.description || t("visitor.activity.no_desc")}
                              </p>
                            </div>

                            {/* Bottom Card Controls */}
                            <div className="mt-auto pt-2 flex flex-col gap-2">
                              {isExternal ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2.5 bg-transparent text-yellow-300 border border-yellow-300 hover:bg-yellow-300 hover:text-[#058562] dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-[#0b120f] rounded-xl text-[11px] font-black text-center block transition-all duration-300 tracking-wider uppercase px-1 truncate shadow-md"
                                >
                                  {buttonText}
                                </a>
                              ) : (
                                <Link
                                  href={href}
                                  className="w-full py-2.5 bg-transparent text-yellow-300 border border-yellow-300 hover:bg-yellow-300 hover:text-[#058562] dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-[#0b120f] rounded-xl text-[11px] font-black text-center block transition-all duration-300 tracking-wider uppercase px-1 truncate shadow-md"
                                >
                                  {buttonText}
                                </Link>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── SECTION 2: PAST ACTIVITIES (ASPECT RATIO 4:3) ─── */}
              {filteredPast.length > 0 && (
                <div className="pt-8 border-t border-white/15 dark:border-white/10">
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-8 max-w-full">
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80 shrink-0" />
                    <h3 className="text-[17px] xs:text-lg sm:text-2xl font-display font-black text-white uppercase tracking-tight whitespace-nowrap">
                      {language === "id" ? "Kegiatan Terlaksana" : "Past Activities"}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-[10px] sm:text-xs font-black border border-white/10 whitespace-nowrap shrink-0">
                      {filteredPast.length} {language === "id" ? "Kegiatan" : "Activities"}
                    </span>
                  </div>

                  <div className="flex overflow-x-auto pb-6 gap-5 scrollbar-none snap-x snap-mandatory flex-nowrap justify-start w-[calc(100%+1.5rem)] -mr-6 pr-6 max-w-none sm:max-w-full sm:w-full sm:mr-0 sm:pr-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6 justify-items-center">
                    {filteredPast.map((act, idx) => {
                      const isExternal = !!act.link;
                      const href = act.link || "/activity";

                      return (
                        <motion.div
                          key={act.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: idx * 0.06 }}
                          className="group relative flex flex-col bg-[#058562] dark:bg-slate-950/75 border-2 border-white/35 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-500 w-[260px] sm:w-full sm:max-w-[280px] shrink-0 sm:shrink snap-center"
                        >
                          {/* Landscape Photo (Aspect Ratio 4:3) */}
                          <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0 bg-slate-900/40">
                            {act.imageUrl ? (
                              <img
                                src={resolveImageUrl(act.imageUrl)}
                                alt={act.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-teal-900/40 to-emerald-950/60 flex flex-col items-center justify-center gap-2 text-white/30">
                                <ActivityIcon className="w-8 h-8" />
                                <span className="text-[9px] uppercase font-bold tracking-widest">Foto 4:3</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                            <div className="absolute top-3 left-3 z-10">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/60 text-yellow-300 dark:text-emerald-400 border border-white/10 backdrop-blur-md">
                                {act.type || "EVENT"}
                              </span>
                            </div>

                            {/* Event Tags Overlay (Date + Location) */}
                            <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] font-semibold text-white bg-black/55 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-md">
                                {formatDate(act.date)}
                              </span>
                              {act.location && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-white/15 text-white border border-white/5 backdrop-blur-md">
                                  <MapPin className="w-3 h-3 text-yellow-300 dark:text-emerald-400" />
                                  <span className="truncate max-w-[110px]">{act.location}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div className="h-[90px] sm:h-[96px] flex flex-col justify-start mb-3">
                              <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-yellow-300 dark:group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2 leading-snug mb-1.5">
                                {act.name}
                              </h4>
                              <p className="text-xs text-white/80 dark:text-gray-400 font-medium leading-normal line-clamp-2">
                                {act.description || t("visitor.activity.no_desc")}
                              </p>
                            </div>

                            {/* Bottom Card Controls */}
                            <div className="mt-auto pt-2 flex flex-col gap-2">
                              {isExternal ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2.5 bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-[#058562] dark:text-gray-300 dark:border-white/10 dark:hover:bg-white dark:hover:text-black rounded-xl text-[11px] font-black text-center block transition-all duration-300 tracking-wider uppercase px-1 truncate shadow-sm"
                                >
                                  {language === "id" ? "Detail" : "Details"}
                                </a>
                              ) : (
                                <Link
                                  href={href}
                                  className="w-full py-2.5 bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-[#058562] dark:text-gray-300 dark:border-white/10 dark:hover:bg-white dark:hover:text-black rounded-xl text-[11px] font-black text-center block transition-all duration-300 tracking-wider uppercase px-1 truncate shadow-sm"
                                >
                                  {language === "id" ? "Detail" : "Details"}
                                </Link>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
