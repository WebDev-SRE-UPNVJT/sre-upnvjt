import React from "react";

export default function MemberDashboardLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse select-none">
      {/* Top Ambient Glow Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Welcome Banner Skeleton (2/3) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-sm min-h-[220px]">
          <div>
            <div className="w-24 h-6 bg-slate-200 dark:bg-white/10 rounded-full mb-4" />
            <div className="w-3/4 sm:w-1/2 h-8 sm:h-10 bg-slate-200 dark:bg-white/10 rounded-lg mb-3" />
            <div className="w-full max-w-md h-4 bg-slate-100 dark:bg-white/5 rounded" />
          </div>
          <div className="mt-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-lg p-4 sm:p-5">
            <div className="flex justify-between items-center mb-2">
              <div className="w-20 h-4 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="w-16 h-4 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Profile Card Skeleton (1/3) */}
        <div className="hidden lg:flex bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-7 flex-col justify-between items-center text-center shadow-sm">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 dark:bg-white/10 mb-4" />
          <div className="w-32 h-5 bg-slate-200 dark:bg-white/10 rounded mb-2" />
          <div className="w-20 h-3 bg-slate-100 dark:bg-white/5 rounded mb-4" />
          <div className="w-full h-12 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5" />
          <div className="w-full h-10 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-xl mt-4" />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/10 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-16 h-6 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="w-24 h-3 bg-slate-100 dark:bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Roadmap & Sidebar Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Roadmap Skeleton (2/3) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="w-40 h-6 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="w-20 h-4 bg-slate-100 dark:bg-white/5 rounded" />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-white/10" />
                    <div className="space-y-1.5">
                      <div className="w-36 h-4 bg-slate-200 dark:bg-white/10 rounded" />
                      <div className="w-24 h-3 bg-slate-100 dark:bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-slate-200 dark:bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton (1/3) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-28 h-5 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="w-12 h-3 bg-slate-100 dark:bg-white/5 rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10" />
                    <div className="space-y-1">
                      <div className="w-24 h-3.5 bg-slate-200 dark:bg-white/10 rounded" />
                      <div className="w-16 h-2.5 bg-slate-100 dark:bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="w-10 h-4 bg-slate-200 dark:bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
