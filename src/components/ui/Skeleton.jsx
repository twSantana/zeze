import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm p-3 flex flex-col gap-3">
      <Skeleton className="w-full h-44 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/3 h-4" />
      </div>
    </div>
  );
}
