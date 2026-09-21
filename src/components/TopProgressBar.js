"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInternal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isFinishing, setIsFinishing] = useState(false);

  const timerRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const safetyTimeoutRef = useRef(null);

  const startProgress = () => {
    // Clear all pending timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setIsFinishing(false);
    setVisible(true);
    setProgress(20);

    // Continuous smooth trickle calculation
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // As it gets closer to 90%, increments get progressively smaller & silky smooth
        const remaining = 90 - prev;
        const step = Math.max(0.5, remaining * 0.12);
        return Math.min(90, prev + step);
      });
    }, 200);

    // Safety fallback (10s)
    safetyTimeoutRef.current = setTimeout(() => {
      completeProgress();
    }, 10000);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setIsFinishing(true);
    setProgress(100);

    // Wait for the bar to hit 100% smoothly before fading out
    finishTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      resetTimeoutRef.current = setTimeout(() => {
        setProgress(0);
        setIsFinishing(false);
      }, 350);
    }, 250);
  };

  // Complete progress on route/searchParam change
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams]);

  // Intercept internal links for instantaneous feedback
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      const download = anchor.getAttribute("download");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target === "_blank" ||
        download !== null ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;

        startProgress();
      } catch (_) {}
    };

    const handleCustomStart = () => startProgress();
    const handleCustomEnd = () => completeProgress();

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("sre:navigation-start", handleCustomStart);
    window.addEventListener("sre:navigation-end", handleCustomEnd);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("sre:navigation-start", handleCustomStart);
      window.removeEventListener("sre:navigation-end", handleCustomEnd);
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <>
      <style>{`
        @keyframes sreBarShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .sre-progress-shimmer {
          background-size: 200% 100%;
          animation: sreBarShimmer 2s linear infinite;
        }
      `}</style>
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] bg-transparent overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-300 sre-progress-shimmer shadow-[0_0_14px_rgba(16,185,129,0.85)] origin-left"
          style={{
            transform: `scaleX(${progress / 100})`,
            transitionProperty: "transform, opacity",
            transitionDuration: isFinishing ? "250ms, 300ms" : "350ms, 200ms",
            transitionTimingFunction: isFinishing
              ? "cubic-bezier(0, 0, 0.2, 1), ease-out"
              : "cubic-bezier(0.16, 1, 0.3, 1), ease-out",
            opacity: visible ? 1 : 0,
            willChange: "transform, opacity",
          }}
        >
          {/* Subtle Glowing Head on the leading edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-4 bg-emerald-300/50 blur-[3px] rounded-full pointer-events-none -mr-4" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-3 bg-white/90 blur-[1px] rounded-full pointer-events-none -mr-1" />
        </div>
      </div>
    </>
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInternal />
    </Suspense>
  );
}
