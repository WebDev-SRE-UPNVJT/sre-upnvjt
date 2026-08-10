"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Users,
  FileText,
  UserCheck,
  TrendingUp,
  Monitor,
  BarChart2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const DEVICE_COLORS = {
  desktop: "#10b981",
  mobile: "#3b82f6",
  tablet: "#f59e0b",
  unknown: "#6b7280",
};

const DEVICE_COLOR_LIST = ["#10b981", "#3b82f6", "#f59e0b", "#6b7280"];

// Stat card - widget style matching DashboardClient
function StatCard({ title, value, subtitle, icon: Icon, color = "primary", badge }) {
  return (
    <motion.div
      variants={item}
      className="bg-white dark:bg-[#08120e] hover:bg-gray-50 dark:hover:bg-[#0a1611] border border-gray-100 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)]"
    >
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full bg-${color}/10 blur-2xl group-hover:bg-${color}/20 group-hover:scale-150 transition-all duration-700`} />

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-${color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm dark:shadow-none`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          {badge}
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-4xl md:text-5xl font-display font-black text-gray-900 dark:text-white tracking-tighter mb-2 truncate">
          {value}
        </h3>
        <p className="text-gray-900 dark:text-white font-bold text-sm tracking-wide mb-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-white/40 font-medium">{subtitle}</p>}
      </div>

      {/* Decorative sparkline */}
      <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,20 L10,15 L20,18 L30,10 L40,12 L50,5 L60,8 L70,2 L80,6 L90,1 L100,5 L100,20 Z" className={`fill-${color}`} />
        </svg>
      </div>
    </motion.div>
  );
}

// Custom tooltip for theme consistency
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0a1611] border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-white/50 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString("en-US")}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsClient({ stats, dailyTraffic, hourlyTraffic, deviceBreakdown, topPages }) {
  const fmt = (n) => (n ?? 0).toLocaleString("en-US");

  return (
    <div className="w-full relative pb-20">
      {/* Background ambience */}
      <div className="absolute top-0 left-1/4 w-125 h-125 bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 relative z-10 pt-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-white/60 mb-6 shadow-sm">
          <BarChart2 className="w-3.5 h-3.5 text-primary" />
          Visitor Analytics
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter mb-4 text-gray-900 dark:text-white leading-[1.1]">
          Visitor <span className="text-primary dark:text-emerald-400">Analytics</span>
        </h1>
        <p className="text-gray-500 dark:text-white/50 text-base md:text-lg max-w-xl font-light leading-relaxed">
          Monitor public website traffic, user devices, and popular pages in real-time.
        </p>
      </motion.div>

      {/* Grid 4 Stat Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Pageviews"
          value={fmt(stats?.totalViews)}
          subtitle="All-time recorded visits"
          icon={Eye}
          color="primary"
          badge="Views"
        />
        <StatCard
          title="Unique Visitors"
          value={fmt(stats?.uniqueVisitors)}
          subtitle="Identified via unique client ID"
          icon={Users}
          color="blue-500"
          badge="Unique"
        />
        <StatCard
          title="Most Visited Page"
          value={stats?.topPage ?? "-"}
          subtitle="Highest traffic route"
          icon={FileText}
          color="emerald-500"
          badge="Top"
        />
        <StatCard
          title="Authenticated Visits"
          value={fmt(stats?.loggedInVisitors)}
          subtitle="Logged-in users on public pages"
          icon={UserCheck}
          color="amber-500"
          badge="Logged In"
        />
      </motion.div>

      {/* Area Chart — Daily Traffic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-10 bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-8 [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper]:focus:outline-none [&_.recharts-surface]:outline-none **:focus:outline-none"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            Daily Traffic
          </h2>
          <span className="ml-auto text-xs text-gray-400 dark:text-white/30 font-medium">Last 14 days</span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={dailyTraffic} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ outline: "none" }}>
            <defs>
              <linearGradient id="gradVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="visits"
              name="Pageviews"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#gradVisits)"
              dot={false}
              activeDot={{ r: 5, fill: "#10b981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Grid 2 Columns: Hourly Bar Chart + Device Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Bar Chart — Traffic by Hour */}
        <div className="bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-8 [&_.recharts-wrapper]:outline-none **:focus:outline-none">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <h2 className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              Traffic by Hour
            </h2>
            <span className="ml-auto text-xs text-gray-400 dark:text-white/30 font-medium">24-hour distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyTraffic} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} style={{ outline: "none" }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="visits" name="Pageviews" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut/Pie Chart — Devices */}
        <div className="bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-8 [&_.recharts-wrapper]:outline-none **:focus:outline-none">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="w-5 h-5 text-amber-500" />
            <h2 className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              Device Breakdown
            </h2>
          </div>
          {deviceBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-gray-400 dark:text-white/30 text-sm font-medium">
              No device data recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart style={{ outline: "none" }}>
                <Pie
                  data={deviceBreakdown}
                  dataKey="visits"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {deviceBreakdown.map((entry, i) => (
                    <Cell
                      key={entry.device}
                      fill={DEVICE_COLORS[entry.device] ?? DEVICE_COLOR_LIST[i % DEVICE_COLOR_LIST.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [Number(val).toLocaleString("en-US"), name]}
                  contentStyle={{
                    backgroundColor: "var(--color-canvas)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs capitalize font-medium text-gray-600 dark:text-white/60">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top Pages Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-6 bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-emerald-500" />
          <h2 className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            Top Visited Pages
          </h2>
        </div>

        {topPages.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/30 font-medium py-6 text-center">
            No pageview data recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-white/5">
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 w-8">#</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">Route Path</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 text-right">Pageviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {topPages.map((page, i) => {
                  const maxVisits = topPages[0]?.visits ?? 1;
                  const pct = Math.round((page.visits / maxVisits) * 100);
                  return (
                    <tr key={page.path} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-4 text-gray-300 dark:text-white/20 font-bold">{i + 1}</td>
                      <td className="py-3.5 pr-4">
                        <div className="font-medium text-gray-900 dark:text-white font-mono text-[13px] mb-1.5 truncate max-w-xs">
                          {page.path}
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                        {page.visits.toLocaleString("en-US")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
