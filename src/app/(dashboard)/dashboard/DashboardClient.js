"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  FileText,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Calendar,
  Activity,
  ArrowRight,
  Clock,
  Plus,
  BarChart2,
  Star,
  Zap,
  Trophy,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import ChartActivity from "./chartActivity";
export default function DashboardClient({ stats, user }) {
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const role = session?.user?.roleName;
  const [greeting, setGreeting] = useState("Welcome");
  const [currentDate, setCurrentDate] = useState("");

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting(t("dashboard.greeting.morning"));
    else if (hour >= 12 && hour < 18)
      setGreeting(t("dashboard.greeting.afternoon"));
    else if (hour >= 18 && hour < 22)
      setGreeting(t("dashboard.greeting.evening"));
    else setGreeting(t("dashboard.greeting.night"));

    setCurrentDate(
      new Date().toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const chartData = stats?.chartData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const rawChartData = stats?.rawChartData || [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const Widget = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "primary",
    trend = "+5%",
  }) => (
    <motion.div
      variants={item}
      className="bg-white dark:bg-[#08120e] hover:bg-gray-50 dark:hover:bg-[#0a1611] border border-gray-100 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)]"
    >
      {/* Decorative Glows */}
      <div
        className={`absolute -right-6 -top-6 w-32 h-32 rounded-full bg-${color}/10 blur-2xl group-hover:bg-${color}/20 group-hover:scale-150 transition-all duration-700`}
      ></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div
          className={`p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-${color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm dark:shadow-none`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-4xl md:text-5xl font-display font-black text-gray-900 dark:text-white tracking-tighter mb-2">
          {value}
        </h3>
        <p className="text-gray-900 dark:text-white font-bold text-sm tracking-wide mb-1">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-white/40 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Mini sparkline mock */}
      <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,20 L10,15 L20,18 L30,10 L40,12 L50,5 L60,8 L70,2 L80,6 L90,1 L100,5 L100,20 Z"
            className={`fill-${color}`}
          />
        </svg>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full relative pb-20">
      {/* Background Ambience */}
      <div
        className="absolute top-0 left-1/4 w-125 h-125 bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse"
        style={{ animationDuration: "6s" }}
      ></div>
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

      {/* Header and ID Card */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-10 mb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 pt-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-white/60 mb-6 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {currentDate}
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter mb-4 text-gray-900 dark:text-white leading-[1.1]">
            {greeting}, <br className="md:hidden" />
            <span className="text-primary dark:text-emerald-400">
              <span className="inline md:hidden">{session?.user?.name?.split(" ")[0] || "User"}</span>
              <span className="hidden md:inline">{session?.user?.name || "User"}</span>
            </span>
          </h1>
          <p className="text-gray-500 dark:text-white/50 text-base md:text-lg max-w-xl font-light mb-8 leading-relaxed">
            {t("dashboard.welcome_msg")}
          </p>
        </motion.div>
      </div>

      {/* Widgets Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Widget
          title={t("dashboard.widgets.total_members")}
          value={stats?.totalUsers || "0"}
          subtitle=""
          icon={Users}
          color="primary"
          trend="+"
        />
        <Widget
          title={t("dashboard.widgets.total_activities")}
          value={stats?.totalActivities || "0"}
          subtitle=""
          icon={Activity}
          color="blue-500"
          trend="Active"
        />
        <Widget
          title={t("dashboard.widgets.published_articles")}
          value={stats?.publishedArticles || "0"}
          subtitle=""
          icon={FileText}
          color="emerald-500"
          trend="Content"
        />
        <Widget
          title={t("dashboard.widgets.departments")}
          value={stats?.totalDepartments || "0"}
          subtitle=""
          icon={Activity}
          color="amber-500"
          trend="Stable"
        />
      </motion.div>

      <div className="mt-10 grid grid-col-1">
        {isClient && <ChartActivity />}
      </div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10"
      >
        {/* Recent Activity Timeline */}
        <div className="bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-8 min-h-110 flex flex-col relative overflow-hidden shadow-sm dark:shadow-none lg:col-span-3">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-display font-bold text-2xl tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              {t("dashboard.timeline.title")}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
            {stats?.recentActivities?.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 dark:border-white/5 ml-3 space-y-8 pb-4 pt-2">
                {stats.recentActivities.map((activity, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    key={activity.id}
                    className="relative pl-6 group"
                  >
                    {/* Timeline Node */}
                    <div className="absolute w-3.5 h-3.5 bg-white dark:bg-[#08120e] border-2 border-primary rounded-full left-[-8.5px] top-1 group-hover:scale-150 group-hover:bg-primary transition-all duration-300" />

                    <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-2xl border border-gray-100 dark:border-white/5 group-hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 pr-2">
                          {activity.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/50 mb-3">
                        {activity.desc}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {activity.type}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-white/40 font-medium">
                          {new Date(activity.date).toLocaleDateString(
                            language === "id" ? "id-ID" : "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-white/[0.01] h-48">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 text-gray-300 dark:text-white/20" />
                </div>
                <p className="text-gray-400 dark:text-white/30 font-bold text-sm tracking-wide">
                  {t("dashboard.timeline.quiet")}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/20 mt-1">
                  {t("dashboard.timeline.no_activities")}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

    
    </div>
  );
}
