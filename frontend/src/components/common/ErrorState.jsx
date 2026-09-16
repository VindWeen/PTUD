import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Component Trạng thái Lỗi chuẩn Soft UI (Error State)
 * Dùng khi API thất bại, mất kết nối mạng hoặc có ngoại lệ
 */
export default function ErrorState({
  title = 'Không thể kết nối đến máy chủ',
  message = 'Đã có sự cố xảy ra trong quá trình truyền tải dữ liệu. Vui lòng kiểm tra lại đường truyền hoặc thử lại sau.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`soft-card py-12 px-6 flex flex-col items-center justify-center text-center border-rose-100/60 dark:border-rose-900/30 ${className}`}>
      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-center text-rose-500 mb-4 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>

      {/* Title & Message */}
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="soft-btn-primary text-xs py-2 px-4 shadow-sm !bg-rose-600 hover:!bg-rose-700 !text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại ngay
          </button>
        )}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="soft-btn-secondary text-xs py-2 px-4"
        >
          Tải lại trang
        </button>
      </div>
    </div>
  );
}
