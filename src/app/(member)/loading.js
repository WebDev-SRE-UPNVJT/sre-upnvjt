import React from "react";

export default function MemberGlobalLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse select-none py-4">
      <div className="w-48 h-8 bg-slate-200 dark:bg-white/10 rounded-lg" />
      <div className="w-full h-36 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
