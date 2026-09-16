import React from 'react';

/**
 * Hiệu ứng Skeleton Loading mô phỏng khung xương giao diện (Shimmer animation)
 */

export function MetricSkeleton({ count = 4 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-5 mb-8 animate-pulse`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="soft-card p-6 flex flex-col justify-between h-36 bg-slate-100/70 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700/80" />
            <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700/80" />
          </div>
          <div>
            <div className="w-20 h-8 rounded-lg bg-slate-200 dark:bg-slate-700/80 mb-2" />
            <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-700/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="w-full soft-card overflow-hidden animate-pulse">
      {/* Table Header Skeleton */}
      <div className="p-4 border-b border-slate-100 dark:border-soft-darkBorder flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="w-48 h-6 rounded-lg bg-slate-200 dark:bg-slate-700/80" />
        <div className="flex gap-2">
          <div className="w-24 h-8 rounded-xl bg-slate-200 dark:bg-slate-700/80" />
          <div className="w-24 h-8 rounded-xl bg-slate-200 dark:bg-slate-700/80" />
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-soft-darkBorder">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/80 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-2/3 h-4 rounded bg-slate-200 dark:bg-slate-700/80" />
                <div className="w-1/3 h-3 rounded bg-slate-200 dark:bg-slate-700/60" />
              </div>
            </div>
            <div className="hidden sm:block w-24 h-6 rounded-full bg-slate-200 dark:bg-slate-700/80" />
            <div className="hidden md:block w-20 h-4 rounded bg-slate-200 dark:bg-slate-700/80" />
            <div className="w-16 h-8 rounded-xl bg-slate-200 dark:bg-slate-700/80 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="soft-card p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700/80" />
          <div className="w-3/4 h-5 rounded bg-slate-200 dark:bg-slate-700/80" />
          <div className="space-y-2">
            <div className="w-full h-3 rounded bg-slate-200 dark:bg-slate-700/60" />
            <div className="w-5/6 h-3 rounded bg-slate-200 dark:bg-slate-700/60" />
          </div>
          <div className="pt-2 flex justify-between items-center">
            <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-700/80" />
            <div className="w-24 h-8 rounded-xl bg-slate-200 dark:bg-slate-700/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ type = 'table', count, rows, cols }) {
  if (type === 'metric') return <MetricSkeleton count={count} />;
  if (type === 'card') return <CardSkeleton count={count} />;
  return <TableSkeleton rows={rows} cols={cols} />;
}
