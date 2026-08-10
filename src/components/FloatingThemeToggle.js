"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function FloatingThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const hiddenPrefixes = [
    "/login", "/dashboard", "/member", "/staff", "/users", "/roles",
    "/tasks", "/departments", "/forms", "/content", "/testimonials",
    "/merch", "/partners", "/literature", "/ppt", "/quiz", "/activities",
    "/leaderboard", "/attendance", "/events-admin", "/applications", "/settings"
  ];

  const isHidden = hiddenPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!mounted || isHidden) return null;

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-20 right-6 z-[60]"
    >
      <motion.button
        whileHover={{ scale: 1.12, rotate: isDark ? 15 : -15 }}
        whileTap={{ scale: 0.88, rotate: isDark ? -25 : 25 }}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`w-12 h-12 rounded-full flex items-center justify-center relative overflow-hidden backdrop-blur-xl border-2 shadow-xl transition-colors duration-500 focus:outline-none cursor-pointer group ${
          isDark
            ? "bg-[#07130e]/90 border-emerald-400 text-emerald-400 shadow-emerald-950/50 hover:shadow-emerald-500/20"
            : "bg-[#0cc48a]/90 border-yellow-300 text-yellow-300 shadow-emerald-900/20 hover:shadow-yellow-300/20"
        }`}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {/* Glow pulse ring on hover */}
        <span className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -120, opacity: 0, scale: 0.4 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 120, opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="text-emerald-400 font-bold"
            >
              <Sun className="w-5 h-5 stroke-[2.2]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 120, opacity: 0, scale: 0.4 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -120, opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="text-yellow-300 font-bold"
            >
              <Moon className="w-5 h-5 stroke-[2.2]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
