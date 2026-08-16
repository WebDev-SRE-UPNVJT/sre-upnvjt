"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ActivityCarousel({ activities }) {
  const { t, language } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [touchStart, setTouchStart] = useState(null);

  const getBadgeText = (type) => {
    if (!type) return t("visitor.home.activity_badge_default") || "Aktivitas";
    const typeUpper = type.toUpperCase();
    if (typeUpper === "FEATURED") {
      return t("visitor.home.activity_badge_highlight") || "Sorotan";
    }
    if (typeUpper === "INTERNAL") {
      return t("visitor.home.activity_badge_internal") || "Internal";
    }
    if (typeUpper === "EXTERNAL") {
      return t("visitor.home.activity_badge_external") || "Eksternal";
    }
    if (typeUpper === "WORKSHOP") {
      return t("visitor.home.activity_badge_workshop") || "Workshop";
    }
    if (typeUpper === "MEETING") {
      return t("visitor.home.activity_badge_meeting") || "Rapat";
    }
    return type;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return "";
    }
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev === 0 ? activities.length - 1 : prev - 1));
  };

  const next = () => {
    setDirection(1);
    setCurrent((prev) => (prev === activities.length - 1 ? 0 : prev + 1));
  };

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  // Touch handlers for mobile swipe
  const onTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) {
      next();
    } else if (diff < -50) {
      prev();
    }
    setTouchStart(null);
  };

  const getIndex = (offset) => (current + offset + activities.length) % activities.length;

  if (!activities || activities.length === 0) return null;
  const count = activities.length;

  // Slide transition animation variants (Smooth spring animation physics)
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 220 : -220,
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -220 : 220,
      opacity: 0,
      scale: 0.92,
    }),
  };

  const getImage = (item) => item?.imageUrl || item?.image || '/images/about/PanelSurya.jpg';
  const getTitle = (item) => item?.name || item?.title || '';

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="w-full max-w-6xl mx-auto relative select-none">
      <div className="relative overflow-hidden w-full pt-4 pb-2 min-h-fit md:min-h-[370px] flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 220, damping: 25 },
              opacity: { duration: 0.35, ease: "easeOut" },
              scale: { duration: 0.35, ease: "easeOut" }
            }}
            className="flex items-center justify-center gap-3 sm:gap-4 w-full"
          >
            {/* CASE 1: Only 1 Activity */}
            {count === 1 && (
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full md:w-[48%] lg:w-[38%] flex-shrink-0 scale-100 z-10 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-yellow-300 dark:border-emerald-400/60 bg-[#099c6d] dark:bg-emerald-950"
              >
                <div className="relative w-full aspect-[4/3]">
                  <img
                    src={getImage(activities[0])}
                    alt={getTitle(activities[0])}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
                  <span className="absolute top-3 right-3 bg-yellow-300 dark:bg-emerald-400 text-slate-900 dark:text-slate-950 text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {getBadgeText(activities[0]?.type)}
                  </span>
                  <h3 className="absolute bottom-3 left-4 right-4 text-white font-black text-sm sm:text-base uppercase tracking-wide line-clamp-1 drop-shadow-sm">
                    {getTitle(activities[0])}
                  </h3>
                </div>
                <div className="p-3.5 sm:p-4 transition-colors duration-300 flex flex-col gap-2">
                  {activities[0]?.date && (
                    <div className="flex items-center text-[10px] sm:text-xs text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-yellow-300 dark:text-emerald-400" />
                      {formatDate(activities[0]?.date)}
                    </div>
                  )}
                  <p className="text-white/95 dark:text-gray-200 text-xs sm:text-sm leading-relaxed font-semibold line-clamp-2">
                    {activities[0]?.description}
                  </p>
                </div>
              </motion.div>
            )}

            {/* CASE 2: Exactly 2 Activities */}
            {count === 2 && (
              <>
                {/* Card 1 (Active) */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-[50%] md:w-[40%] lg:w-[32%] flex-shrink-0 scale-100 z-10 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-yellow-300 dark:border-emerald-400/60 bg-[#099c6d] dark:bg-emerald-950"
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[current])}
                      alt={getTitle(activities[current])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
                    <span className="absolute top-3 right-3 bg-yellow-300 dark:bg-emerald-400 text-slate-900 dark:text-slate-950 text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {getBadgeText(activities[current]?.type)}
                    </span>
                    <h3 className="absolute bottom-3 left-4 right-4 text-white font-black text-sm sm:text-base uppercase tracking-wide line-clamp-1 drop-shadow-sm">
                      {getTitle(activities[current])}
                    </h3>
                  </div>
                  <div className="p-3.5 sm:p-4 transition-colors duration-300 flex flex-col gap-2">
                    {activities[current]?.date && (
                      <div className="flex items-center text-[10px] sm:text-xs text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[current]?.date)}
                      </div>
                    )}
                    <p className="text-white/95 dark:text-gray-200 text-xs sm:text-sm leading-relaxed font-semibold line-clamp-2">
                      {activities[current]?.description}
                    </p>
                  </div>
                </motion.div>

                {/* Card 2 (Inactive) */}
                <motion.div
                  whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-[40%] md:w-[26%] lg:w-[20.5%] flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
                  onClick={next}
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[getIndex(1)])}
                      alt={getTitle(activities[getIndex(1)])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                    <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide line-clamp-1">
                      {getTitle(activities[getIndex(1)])}
                    </h3>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    {activities[getIndex(1)]?.date && (
                      <div className="flex items-center text-[9px] text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3 h-3 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[getIndex(1)]?.date)}
                      </div>
                    )}
                    <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                      {activities[getIndex(1)]?.description}
                    </p>
                  </div>
                </motion.div>
              </>
            )}

            {/* CASE 3: Exactly 3 Activities */}
            {count === 3 && (
              <>
                {/* Card 1 (Left, Inactive) */}
                <motion.div
                  whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="hidden md:block md:w-[26%] lg:w-[20.5%] flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
                  onClick={prev}
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[getIndex(-1)])}
                      alt={getTitle(activities[getIndex(-1)])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                    <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide line-clamp-1">
                      {getTitle(activities[getIndex(-1)])}
                    </h3>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    {activities[getIndex(-1)]?.date && (
                      <div className="flex items-center text-[9px] text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3 h-3 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[getIndex(-1)]?.date)}
                      </div>
                    )}
                    <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                      {activities[getIndex(-1)]?.description}
                    </p>
                  </div>
                </motion.div>

                {/* Card 2 (Center, Active) */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full md:w-[40%] lg:w-[32%] flex-shrink-0 scale-100 z-10 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-yellow-300 dark:border-emerald-400/60 bg-[#099c6d] dark:bg-emerald-950"
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[current])}
                      alt={getTitle(activities[current])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
                    <span className="absolute top-3 right-3 bg-yellow-300 dark:bg-emerald-400 text-slate-900 dark:text-slate-950 text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {getBadgeText(activities[current]?.type)}
                    </span>
                    <h3 className="absolute bottom-3 left-4 right-4 text-white font-black text-sm sm:text-base uppercase tracking-wide line-clamp-1 drop-shadow-sm">
                      {getTitle(activities[current])}
                    </h3>
                  </div>
                  <div className="p-3.5 sm:p-4 transition-colors duration-300 flex flex-col gap-2">
                    {activities[current]?.date && (
                      <div className="flex items-center text-[10px] sm:text-xs text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[current]?.date)}
                      </div>
                    )}
                    <p className="text-white/95 dark:text-gray-200 text-xs sm:text-sm leading-relaxed font-semibold line-clamp-2">
                      {activities[current]?.description}
                    </p>
                  </div>
                </motion.div>

                {/* Card 3 (Right, Inactive) */}
                <motion.div
                  whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="hidden md:block md:w-[26%] lg:w-[20.5%] flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
                  onClick={next}
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[getIndex(1)])}
                      alt={getTitle(activities[getIndex(1)])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                    <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide line-clamp-1">
                      {getTitle(activities[getIndex(1)])}
                    </h3>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    {activities[getIndex(1)]?.date && (
                      <div className="flex items-center text-[9px] text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[getIndex(1)]?.date)}
                      </div>
                    )}
                    <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                      {getTitle(activities[getIndex(1)]) ? activities[getIndex(1)]?.description : ''}
                    </p>
                  </div>
                </motion.div>
              </>
            )}

            {/* CASE 4: 4 or More Activities */}
            {count >= 4 && (
              <>
                {/* CARD 1 (Left, Inactive) */}
                <motion.div
                  whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="hidden md:block md:w-[26%] lg:w-[20.5%] flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
                  onClick={prev}
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[getIndex(-1)])}
                      alt={getTitle(activities[getIndex(-1)])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                    <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide line-clamp-1">
                      {getTitle(activities[getIndex(-1)])}
                    </h3>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    {activities[getIndex(-1)]?.date && (
                      <div className="flex items-center text-[9px] text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3 h-3 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[getIndex(-1)]?.date)}
                      </div>
                    )}
                    <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                      {activities[getIndex(-1)]?.description}
                    </p>
                  </div>
                </motion.div>

                {/* CARD 2 (Center-Left, Active) */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full md:w-[40%] lg:w-[32%] flex-shrink-0 scale-100 z-10 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-yellow-300 dark:border-emerald-400/60 bg-[#099c6d] dark:bg-emerald-950"
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[current])}
                      alt={getTitle(activities[current])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
                    <span className="absolute top-3 right-3 bg-yellow-300 dark:bg-emerald-400 text-slate-900 dark:text-slate-950 text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {getBadgeText(activities[current]?.type)}
                    </span>
                    <h3 className="absolute bottom-3 left-4 right-4 text-white font-black text-sm sm:text-base uppercase tracking-wide line-clamp-1 drop-shadow-sm">
                      {getTitle(activities[current])}
                    </h3>
                  </div>
                  <div className="p-3.5 sm:p-4 transition-colors duration-300 flex flex-col gap-2">
                    {activities[current]?.date && (
                      <div className="flex items-center text-[10px] sm:text-xs text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[current]?.date)}
                      </div>
                    )}
                    <p className="text-white/95 dark:text-gray-200 text-xs sm:text-sm leading-relaxed font-semibold line-clamp-2">
                      {activities[current]?.description}
                    </p>
                  </div>
                </motion.div>

                {/* CARD 3 (Center-Right, Inactive) */}
                <motion.div
                  whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="hidden md:block md:w-[26%] lg:w-[20.5%] flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
                  onClick={next}
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[getIndex(1)])}
                      alt={getTitle(activities[getIndex(1)])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                    <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide line-clamp-1">
                      {getTitle(activities[getIndex(1)])}
                    </h3>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    {activities[getIndex(1)]?.date && (
                      <div className="flex items-center text-[9px] text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[getIndex(1)]?.date)}
                      </div>
                    )}
                    <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                      {getTitle(activities[getIndex(1)]) ? activities[getIndex(1)]?.description : ''}
                    </p>
                  </div>
                </motion.div>

                {/* CARD 4 (Right, Inactive) */}
                <motion.div
                  whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="hidden lg:block lg:w-[20.5%] flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
                  onClick={() => goTo(getIndex(2))}
                >
                  <div className="relative w-full aspect-[4/3]">
                    <img
                      src={getImage(activities[getIndex(2)])}
                      alt={getTitle(activities[getIndex(2)])}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                    <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide line-clamp-1">
                      {getTitle(activities[getIndex(2)])}
                    </h3>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    {activities[getIndex(2)]?.date && (
                      <div className="flex items-center text-[9px] text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3 h-3 mr-1 text-yellow-300 dark:text-emerald-400" />
                        {formatDate(activities[getIndex(2)]?.date)}
                      </div>
                    )}
                    <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                      {activities[getIndex(2)]?.description}
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls — Pure bright yellow in Light Mode, emerald in Dark Mode */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-3.5 sm:gap-4 mt-4 sm:mt-6">
          <button
            onClick={prev}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-yellow-300 hover:bg-yellow-400 text-slate-950 border border-yellow-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:border-transparent flex items-center justify-center transition-all duration-300 shadow-md transform hover:scale-110 active:scale-95 focus-visible:outline-yellow-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 dark:text-white stroke-[2.5]" />
          </button>
          <div className="flex gap-1.5 sm:gap-2">
            {activities.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 focus-visible:outline-yellow-300 ${
                  i === current ? 'w-5 sm:w-6 bg-yellow-300 dark:bg-emerald-400' : 'w-1.5 sm:w-2 bg-white/40 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-yellow-300 hover:bg-yellow-400 text-slate-950 border border-yellow-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:border-transparent flex items-center justify-center transition-all duration-300 shadow-md transform hover:scale-110 active:scale-95 focus-visible:outline-yellow-300"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 dark:text-white stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
