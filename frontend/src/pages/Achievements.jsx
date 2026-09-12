import React from 'react';
import { Award, Plus, Filter, Search } from 'lucide-react';

export default function Achievements() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Hồ sơ Thành tích Cá nhân & Tập thể
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý danh sách kê khai bài báo, đề tài nghiên cứu khoa học, giải thưởng và minh chứng số.
          </p>
        </div>
        <button className="soft-btn-primary text-sm">
          <Plus className="w-4 h-4" />
          <span>Thêm thành tích mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="soft-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên thành tích, mã hoặc chủ thể..."
              className="soft-input w-full pl-9 text-xs"
            />
          </div>
          <select className="soft-input text-xs py-2">
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="SUBMITTED">Đã nộp chờ duyệt (SUBMITTED)</option>
            <option value="NEED_CORRECTION">Cần bổ sung (NEED_CORRECTION)</option>
            <option value="VERIFIED">Đã xác nhận (VERIFIED)</option>
          </select>
        </div>
        <button className="soft-btn-secondary text-xs">
          <Filter className="w-3.5 h-3.5" />
          <span>Lọc nâng cao</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="soft-card p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
          <Award className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Chưa có thành tích nào được kê khai
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
          Bắt đầu tạo hồ sơ thành tích mới và tải lên tài liệu minh chứng để gửi người quản lý xét duyệt.
        </p>
        <button className="soft-btn-primary text-xs mx-auto">
          <Plus className="w-4 h-4" />
          <span>Kê khai ngay</span>
        </button>
      </div>
    </div>
  );
}
