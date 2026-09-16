import React from 'react';
import { FolderSearch, Plus, RotateCcw } from 'lucide-react';

/**
 * Component Trạng thái Rỗng chuẩn Soft UI (Empty State)
 * Dùng khi danh sách rỗng, không tìm thấy kết quả tìm kiếm, hoặc chưa có hồ sơ
 */
export default function EmptyState({
  icon: Icon = FolderSearch,
  title = 'Không tìm thấy dữ liệu phù hợp',
  description = 'Thử điều chỉnh hoặc xóa bộ lọc tìm kiếm để xem thêm các kết quả khác.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon = RotateCcw,
  secondaryLabel,
  onSecondary,
  className = '',
}) {
  return (
    <div className={`soft-card py-12 px-6 flex flex-col items-center justify-center text-center transition-all ${className}`}>
      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-soft-darkBorder flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>

      {/* Title & Description */}
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {/* Action Buttons */}
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="soft-btn-primary text-xs py-2 px-4 shadow-sm"
            >
              {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
              {actionLabel}
            </button>
          )}

          {secondaryLabel && (
            <button
              type="button"
              onClick={onSecondary}
              className="soft-btn-secondary text-xs py-2 px-4"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
