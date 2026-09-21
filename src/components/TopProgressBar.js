"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInternal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const safetyTimeoutRef = useRef(null);

  const startProgress = () => {
    // Clear any existing timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setVisible(true);
    setProgress(15);

    // Incrementally advance progress to simulate loading state
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 35) return prev + 15;
        if (prev < 65) return prev + 8;
        if (prev < 85) return prev + 3;
        if (prev < 92) return prev + 0.5;
        return prev;
      });
    }, 150);

    // Safety timeout in case navigation is cancelled or errors
    safetyTimeoutRef.current = setTimeout(() => {
      completeProgress();
    }, 10000);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setProgress(100);

    finishTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 350);
  };

  // Complete progress when route / searchParams change
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams]);

  // Intercept all internal link clicks to trigger progress bar immediately
  useEffect(() => {
    const handleDocumentClick = (e) => {
      // Find closest anchor tag
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      const download = anchor.getAttribute("download");

      // Skip non-navigation or external links
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

      // Check if URL points to same origin
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;

        // Skip if navigating to the exact same full URL (including hash)
        if (url.href === window.location.href) return;

        // Trigger loading bar
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
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] sm:h-[3.5px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "250ms",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Glowing Head / Leading Edge */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-4 bg-emerald-400/40 blur-sm rounded-full pointer-events-none -mr-4" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/80 blur-[2px] rounded-full pointer-events-none -mr-1" />
      </div>
    </div>
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInternal />
    </Suspense>
  );
}
