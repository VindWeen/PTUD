import React from 'react';
import { FileCheck2, Plus } from 'lucide-react';

export default function Awards() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ghi nhận Khen thưởng có Quyết định
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dành cho Cán bộ Hồ sơ (RecordsOfficer) nhập và quản lý các danh hiệu thi đua đã có quyết định chính thức.
          </p>
        </div>
        <button className="soft-btn-primary text-sm">
          <Plus className="w-4 h-4" />
          <span>Ghi nhận Quyết định mới</span>
        </button>
      </div>

      <div className="soft-card p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
          <FileCheck2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Chưa có bản ghi khen thưởng nào
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
          Bắt đầu ghi nhận số quyết định, ngày ban hành và danh sách cá nhân/tập thể được khen thưởng.
        </p>
        <button className="soft-btn-primary text-xs mx-auto">
          <Plus className="w-4 h-4" />
          <span>Thêm quyết định</span>
        </button>
      </div>
    </div>
  );
}
