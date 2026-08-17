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

  const carouselItems = React.useMemo(() => {
    if (!activities) return [];
    const items = [...activities];
    if (activities.length > 0 && activities.length < 4) {
      items.push({ isDefault: true });
    }
    return items;
  }, [activities]);

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

  if (!carouselItems || carouselItems.length === 0) return null;
  const count = carouselItems.length;

  const prev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev === 0 ? count - 1 : prev - 1));
  };

  const next = () => {
    setDirection(1);
    setCurrent((prev) => (prev === count - 1 ? 0 : prev + 1));
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

  const getIndex = (offset) => (current + offset + count) % count;

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

  const getImage = (item) => {
    const url = item?.imageUrl || item?.image || '';
    if (!url) return '/images/about/PanelSurya.jpg';
    const cleaned = url
      .replace("https://pub-7a6619b60d5847c1a16624560e5575dd.r2.dev/", "")
      .replace("https://cdn.webly.biz.id/", "");
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://") || cleaned.startsWith("/")) {
      return cleaned;
    }
    return `/api/cdn/${cleaned.replace(/^\/+/, "")}`;
  };
  const getTitle = (item) => item?.name || item?.title || '';

  const renderCardItem = (item, isActive, sizeClass, onClick = null) => {
    const isDefaultCard = item?.isDefault;

    if (isDefaultCard) {
      if (isActive) {
        return (
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClick}
            className={`${sizeClass} flex-shrink-0 scale-100 z-10 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-yellow-300 dark:border-emerald-400/60 bg-[#099c6d] dark:bg-emerald-950 flex flex-col`}
          >
            <div className="relative w-full aspect-[4/3] flex flex-col items-center justify-center pt-5 pb-1 px-3 text-center bg-gradient-to-b from-yellow-300/10 to-transparent dark:from-emerald-500/10 dark:to-transparent flex-shrink-0 select-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-yellow-300/15 dark:bg-emerald-500/15 rounded-full blur-xl pointer-events-none animate-pulse" />
              <div className="relative z-10 p-2.5 rounded-xl bg-white/10 dark:bg-white/[0.05] border border-white/20 dark:border-white/10 mb-1 text-yellow-300 dark:text-emerald-400">
                <svg className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </div>
              <span className="relative z-10 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-yellow-300 dark:text-emerald-400">
                {language === "id" ? "DOKUMENTASI & ARSIP" : "DOCUMENTATION & ARCHIVE"}
              </span>
              <h3 className="relative z-10 text-base sm:text-lg md:text-xl font-extrabold text-white leading-snug mt-1 px-2 line-clamp-1">
                {language === "id" ? "Lebih Banyak Kegiatan Hadir!" : "More Activities Coming!"}
              </h3>
            </div>
            <div className="pt-1.5 pb-4 px-3.5 sm:p-4 transition-colors duration-300 flex flex-col gap-2 flex-grow justify-between">
              <p className="text-white/95 dark:text-gray-200 text-xs sm:text-sm leading-relaxed font-semibold line-clamp-2">
                {language === "id"
                  ? "Kami terus menjalankan berbagai proyek riset, workshop, dan kampanye sosial. Ikuti perjalanan transisi energi kami!"
                  : "We continuously run various research projects, workshops, and social campaigns. Follow our energy transition journey!"}
              </p>
              <a
                href="https://www.instagram.com/sre.upnjatim/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-yellow-300 hover:bg-yellow-400 text-[#058562] hover:text-black dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 font-black rounded-xl text-[11px] sm:text-xs text-center block transition-all duration-300 tracking-wider uppercase shadow-md"
              >
                {language === "id" ? "Ikuti Instagram Kami" : "Follow Our Instagram"}
              </a>
            </div>
          </motion.div>
        );
      } else {
        return (
          <motion.div
            whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClick}
            className={`${sizeClass} flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg flex flex-col`}
          >
            <div className="relative w-full aspect-[4/3] flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-yellow-300/5 to-transparent dark:from-emerald-500/5 dark:to-transparent flex-shrink-0">
              <div className="p-2 rounded-lg bg-white/10 dark:bg-white/[0.05] border border-white/20 dark:border-white/10 mb-2 text-yellow-300 dark:text-emerald-400">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider line-clamp-1 px-1">
                {language === "id" ? "Segera Hadir!" : "Coming Soon!"}
              </h3>
            </div>
            <div className="p-3 flex flex-col gap-1.5 flex-grow">
              <p className="text-emerald-50 dark:text-gray-300 text-[10px] leading-relaxed font-bold line-clamp-2">
                {language === "id" ? "Dokumentasi kegiatan SRE UPNVJT berikutnya." : "Documentation of next SRE UPNVJT activity."}
              </p>
            </div>
          </motion.div>
        );
      }
    }

    if (isActive) {
      return (
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={onClick}
          className={`${sizeClass} flex-shrink-0 scale-100 z-10 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-yellow-300 dark:border-emerald-400/60 bg-[#099c6d] dark:bg-emerald-950`}
        >
          <div className="relative w-full aspect-[4/3]">
            <img
              src={getImage(item)}
              alt={getTitle(item)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
            <span className="absolute top-3 right-3 bg-yellow-300 dark:bg-emerald-400 text-slate-900 dark:text-slate-950 text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {getBadgeText(item?.type)}
            </span>
            <h3 className="absolute bottom-3 left-4 right-4 text-white font-black text-sm sm:text-base uppercase tracking-wide line-clamp-1 drop-shadow-sm">
              {getTitle(item)}
            </h3>
          </div>
          <div className="p-3.5 sm:p-4 transition-colors duration-300 flex flex-col gap-2">
            {item?.date && (
              <div className="flex items-center text-[10px] sm:text-xs text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 mr-1 text-yellow-300 dark:text-emerald-400" />
                {formatDate(item?.date)}
              </div>
            )}
            <p className="text-white/95 dark:text-gray-200 text-xs sm:text-sm leading-relaxed font-semibold line-clamp-2">
              {item?.description}
            </p>
          </div>
        </motion.div>
      );
    } else {
      return (
        <motion.div
          whileHover={{ y: -4, scale: 0.95, opacity: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={onClick}
          className={`${sizeClass} flex-shrink-0 opacity-50 scale-90 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg`}
        >
          <div className="relative w-full aspect-[4/3]">
            <img
              src={getImage(item)}
              alt={getTitle(item)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
            <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide line-clamp-1">
              {getTitle(item)}
            </h3>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {item?.date && (
              <div className="flex items-center text-[9px] text-yellow-300 dark:text-emerald-400 font-bold uppercase tracking-wider">
                <Calendar className="w-3 h-3 mr-1 text-yellow-300 dark:text-emerald-400" />
                {formatDate(item?.date)}
              </div>
            )}
            <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
              {item?.description}
            </p>
          </div>
        </motion.div>
      );
    }
  };

  const indicesMap4 = {
    0: [2, 0, 1, 3],
    1: [0, 1, 2, 3],
    2: [1, 2, 3, 0],
    3: [2, 3, 0, 1],
  };

  const indicesMap3 = {
    0: [1, 0, 2],
    1: [0, 1, 2],
    2: [1, 2, 0],
  };

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
            {count === 1 && renderCardItem(carouselItems[0], true, "w-full md:w-[48%] lg:w-[38%]")}

            {/* CASE 2: Exactly 2 Activities */}
            {count === 2 && (
              <>
                {renderCardItem(carouselItems[current], true, "w-[50%] md:w-[40%] lg:w-[32%]")}
                {renderCardItem(carouselItems[getIndex(1)], false, "w-[40%] md:w-[26%] lg:w-[20.5%]", next)}
              </>
            )}

            {/* CASE 3: Exactly 3 Activities */}
            {count === 3 && (
              <>
                {renderCardItem(carouselItems[indicesMap3[current][0]], false, "hidden md:block md:w-[26%] lg:w-[20.5%]", prev)}
                {renderCardItem(carouselItems[indicesMap3[current][1]], true, "w-full md:w-[40%] lg:w-[32%]")}
                {renderCardItem(carouselItems[indicesMap3[current][2]], false, "hidden md:block md:w-[26%] lg:w-[20.5%]", next)}
              </>
            )}

            {/* CASE 4: 4 or More Activities */}
            {count >= 4 && (
              <>
                {renderCardItem(carouselItems[count === 4 ? indicesMap4[current][0] : getIndex(-1)], false, "hidden md:block md:w-[26%] lg:w-[20.5%]", prev)}
                {renderCardItem(carouselItems[count === 4 ? indicesMap4[current][1] : current], true, "w-full md:w-[40%] lg:w-[32%]")}
                {renderCardItem(carouselItems[count === 4 ? indicesMap4[current][2] : getIndex(1)], false, "hidden md:block md:w-[26%] lg:w-[20.5%]", next)}
                {renderCardItem(carouselItems[count === 4 ? indicesMap4[current][3] : getIndex(2)], false, "hidden lg:block lg:w-[20.5%]", () => goTo(count === 4 ? indicesMap4[current][3] : getIndex(2)))}
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
            {carouselItems.map((_, i) => (
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
