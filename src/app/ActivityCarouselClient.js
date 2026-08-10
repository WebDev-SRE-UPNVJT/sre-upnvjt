"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ActivityCarousel({ activities }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [touchStart, setTouchStart] = useState(null);

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
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="w-full relative select-none">
      <div className="relative overflow-hidden w-full py-2 min-h-[380px] flex items-center justify-center">
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
            className="flex items-center justify-center gap-4 w-full px-4"
          >
            {/* LEFT CARD — Inactive, smaller, with matching structural components */}
            <div
              className="hidden md:block md:w-[28%] md:max-w-[320px] lg:max-w-[340px] xl:max-w-[360px] flex-shrink-0 opacity-50 scale-90 transition-all duration-500 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
              onClick={prev}
            >
              <div className="relative h-[160px]">
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
              <div className="p-3">
                <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                  {activities[getIndex(-1)]?.description}
                </p>
              </div>
            </div>

            {/* CENTER CARD — featured (Emerald background matching about section cards) */}
            <div className="w-full md:w-[44%] flex-shrink-0 scale-100 z-10 shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/50 transition-all duration-500 rounded-2xl overflow-hidden border-2 border-yellow-300 dark:border-emerald-400/60 bg-[#099c6d] dark:bg-emerald-950">
              <div className="relative h-[280px]">
                <img
                  src={getImage(activities[current])}
                  alt={getTitle(activities[current])}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
                <span className="absolute top-3 right-3 bg-yellow-300 dark:bg-emerald-400 text-slate-900 dark:text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {activities[current]?.type || "Featured"}
                </span>
                <h3 className="absolute bottom-3 left-4 text-white font-black text-base uppercase tracking-wide line-clamp-1">
                  {getTitle(activities[current])}
                </h3>
              </div>
              <div className="p-4 transition-colors duration-300">
                <p className="text-white dark:text-gray-300 text-sm leading-relaxed font-bold line-clamp-2">
                  {activities[current]?.description}
                </p>
              </div>
            </div>

            {/* RIGHT CARD — Inactive, smaller, with matching structural components */}
            <div
              className="hidden md:block md:w-[28%] md:max-w-[320px] lg:max-w-[340px] xl:max-w-[360px] flex-shrink-0 opacity-50 scale-90 transition-all duration-500 rounded-2xl overflow-hidden cursor-pointer border-2 border-yellow-300 dark:border-emerald-500/40 bg-[#099c6d] dark:bg-[#093021] shadow-lg"
              onClick={next}
            >
              <div className="relative h-[160px]">
                <img
                  src={getImage(activities[getIndex(1)])}
                  alt={getTitle(activities[getIndex(1)])}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                <h3 className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wide">
                  {activities[getIndex(1)].title}
                </h3>
              </div>


              <div className="p-3">
                <p className="text-emerald-50 dark:text-gray-300 text-[11px] leading-relaxed font-bold line-clamp-2">
                  {activities[getIndex(1)].description}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls — Pure bright yellow in Light Mode, emerald in Dark Mode */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full bg-yellow-300 hover:bg-yellow-400 text-slate-950 border border-yellow-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:border-transparent flex items-center justify-center transition-all duration-300 shadow-md transform hover:scale-110 active:scale-95 focus-visible:outline-yellow-300"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 text-slate-950 dark:text-white stroke-[2.5]" />
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
          className="w-10 h-10 rounded-full bg-yellow-300 hover:bg-yellow-400 text-slate-950 border border-yellow-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:border-transparent flex items-center justify-center transition-all duration-300 shadow-md transform hover:scale-110 active:scale-95 focus-visible:outline-yellow-300"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 text-slate-950 dark:text-white stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
