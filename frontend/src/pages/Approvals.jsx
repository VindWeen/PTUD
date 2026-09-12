import React from 'react';
import { CheckSquare, AlertCircle } from 'lucide-react';

export default function Approvals() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Hàng chờ Xét duyệt Thành tích
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Dành cho Cán bộ Quản lý (Manager) thẩm định minh chứng và xác nhận trong phạm vi được phân công.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Lưu ý quy tắc Blueprint:</strong> Bạn chỉ thấy và duyệt được hồ sơ thuộc phạm vi đơn vị được giao. Hệ thống sẽ tự động chặn nếu bạn cố gắng duyệt hồ sơ do chính mình tạo.
        </span>
      </div>

      <div className="soft-card p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
          <CheckSquare className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Hiện không có hồ sơ nào chờ xét duyệt
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Các hồ sơ thành tích sau khi giảng viên hoặc đại diện bộ môn gửi sẽ hiển thị tại đây.
        </p>
      </div>
    </div>
  );
}
