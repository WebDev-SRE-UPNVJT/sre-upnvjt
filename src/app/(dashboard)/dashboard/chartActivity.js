"use client";

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FileText, CheckSquare, Users, BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#0c1813]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-xl text-xs space-y-2 min-w-40 z-50">
        <p className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-1.5 flex items-center justify-between">
          <span>Bulan {label}</span>
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
        </p>
        {payload.map((entry, index) => {
          let labelName = entry.name;
          let icon = null;
          if (entry.dataKey === 'articles') {
            labelName = 'Artikel Terbit';
            icon = <FileText className="w-3 h-3 text-emerald-500" />;
          } else if (entry.dataKey === 'submissions') {
            labelName = 'Tugas Disubmit';
            icon = <CheckSquare className="w-3 h-3 text-blue-500" />;
          } else if (entry.dataKey === 'attendances') {
            labelName = 'Presensi Kegiatan';
            icon = <Users className="w-3 h-3 text-purple-500" />;
          }

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-white/70">
                {icon}
                {labelName}
              </span>
              <span className="font-black text-gray-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const ChartActivity = ({ data = [], year }) => {
  const [activeSeries, setActiveSeries] = useState({
    articles: true,
    submissions: true,
    attendances: true,
  });

  const toggleSeries = (key) => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const defaultMonths = [
    { name: 'Jan', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Feb', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Mar', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Apr', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Mei', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Jun', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Jul', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Agu', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Sep', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Okt', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Nov', articles: 0, submissions: 0, attendances: 0 },
    { name: 'Des', articles: 0, submissions: 0, attendances: 0 },
  ];

  const chartData = data && data.length > 0 ? data : defaultMonths;
  const currentYear = year || new Date().getFullYear();

  const totalArticles = chartData.reduce((acc, curr) => acc + (curr.articles || 0), 0);
  const totalSubmissions = chartData.reduce((acc, curr) => acc + (curr.submissions || 0), 0);
  const totalAttendances = chartData.reduce((acc, curr) => acc + (curr.attendances || 0), 0);

  return (
    <div className="bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none transition-all duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-display font-black text-xl md:text-2xl tracking-tight text-gray-900 dark:text-white">
              Tren Aktivitas Operasional
            </h3>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-white/50">
            Performa publikasi konten, kepatuhan tugas divisi, & presensi kegiatan ({currentYear})
          </p>
        </div>

        {/* Interactive Legend / Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSeries('articles')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSeries.articles
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-transparent opacity-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <FileText className="w-3.5 h-3.5" />
            <span>Artikel ({totalArticles})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('submissions')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSeries.submissions
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-transparent opacity-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tugas ({totalSubmissions})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('attendances')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSeries.attendances
                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shadow-sm'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-transparent opacity-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <Users className="w-3.5 h-3.5" />
            <span>Presensi ({totalAttendances})</span>
          </button>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="w-full h-80 [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper]:focus:outline-none [&_.recharts-surface]:outline-none [&_.recharts-surface]:focus:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Gradient for Articles */}
              <linearGradient id="gradientArticles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>

              {/* Gradient for Submissions */}
              <linearGradient id="gradientSubmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>

              {/* Gradient for Attendances */}
              <linearGradient id="gradientAttendances" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-gray-200/60 dark:text-white/5"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-400 dark:text-white/40"
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-400 dark:text-white/40"
            />

            <Tooltip content={<CustomTooltip />} />

            {activeSeries.attendances && (
              <Area
                type="monotone"
                dataKey="attendances"
                stroke="#a855f7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientAttendances)"
              />
            )}

            {activeSeries.submissions && (
              <Area
                type="monotone"
                dataKey="submissions"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientSubmissions)"
              />
            )}

            {activeSeries.articles && (
              <Area
                type="monotone"
                dataKey="articles"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientArticles)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartActivity;
