"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  BookOpen,
  Building2,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DashboardClient({ stats, user }) {
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const [greeting, setGreeting] = useState("Welcome");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting(t("dashboard.greeting.morning") || "Selamat Pagi");
    else if (hour >= 12 && hour < 18)
      setGreeting(t("dashboard.greeting.afternoon") || "Selamat Siang");
    else if (hour >= 18 && hour < 22)
      setGreeting(t("dashboard.greeting.evening") || "Selamat Sore");
    else setGreeting(t("dashboard.greeting.night") || "Selamat Malam");

    setCurrentDate(
      new Date().toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, [language, t]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const cards = [
    {
      title: t("dashboard.widgets.total_members") || "Total Anggota",
      value: stats?.totalUsers ?? 0,
      href: "/users",
      icon: Users,
      bgGlow: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      borderColor: "hover:border-emerald-500/30",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    },
    {
      title: t("dashboard.widgets.total_activities") || "Total Kegiatan",
      value: stats?.totalActivities ?? 0,
      href: "/activities",
      icon: Activity,
      bgGlow: "from-blue-500/15 via-blue-500/5 to-transparent",
      borderColor: "hover:border-blue-500/30",
      iconBg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    },
    {
      title: t("dashboard.widgets.total_literature") || "Literature Bank",
      value: stats?.totalLiterature ?? 0,
      href: "/literature",
      icon: BookOpen,
      bgGlow: "from-amber-500/15 via-amber-500/5 to-transparent",
      borderColor: "hover:border-amber-500/30",
      iconBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
    },
    {
      title: t("dashboard.widgets.departments") || "Departemen",
      value: stats?.totalDepartments ?? 0,
      href: "/departments",
      icon: Building2,
      bgGlow: "from-purple-500/15 via-purple-500/5 to-transparent",
      borderColor: "hover:border-purple-500/30",
      iconBg: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden relative pb-10">
      {/* Background Ambience */}
      <div
        className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"
      />
      <div className="absolute top-20 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[90px] pointer-events-none mix-blend-screen" />

      {/* Header and Welcome */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-6 mb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 pt-2 min-w-0 w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-white/60 mb-4 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {currentDate}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter mb-2 text-gray-900 dark:text-white leading-tight break-words">
            {greeting},{" "}
            <span className="text-primary dark:text-emerald-400">
              {session?.user?.name || "User"}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-white/50 text-sm md:text-base max-w-xl font-light">
            {t("dashboard.welcome_msg") || "Selamat datang di SRE UPN Veteran Jawa Timur Admin Portal."}
          </p>
        </motion.div>
      </div>

      {/* Stat Cards Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10"
      >
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              variants={item}
              className={`bg-white dark:bg-[#08120e] hover:bg-gray-50 dark:hover:bg-[#0b1813] border border-gray-100 dark:border-white/5 ${card.borderColor} rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none min-w-0`}
            >
              {/* Background gradient glow on hover */}
              <div
                className={`absolute -right-6 -top-6 w-32 h-32 rounded-full bg-gradient-to-br ${card.bgGlow} blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none`}
              />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div
                  className={`p-3 rounded-2xl border ${card.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <Link
                  href={card.href}
                  className="text-gray-400 hover:text-primary dark:text-white/30 dark:hover:text-emerald-400 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                  title="Lihat Detail"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-display font-black text-gray-900 dark:text-white tracking-tight mb-1">
                  {card.value}
                </h3>
                <p className="text-gray-600 dark:text-white/70 font-semibold text-sm">
                  {card.title}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
