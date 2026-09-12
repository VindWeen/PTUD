import React from 'react';
import { BarChart3, Download } from 'lucide-react';

export default function Reports() {
  const handleExportCSV = () => {
    window.open('/api/v1/reports/export', '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Thống kê & Xuất Báo cáo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp dữ liệu thành tích theo năm học, đơn vị và xuất file CSV phục vụ kiểm toán thi đua.
          </p>
        </div>
        <button onClick={handleExportCSV} className="soft-btn-primary text-sm">
          <Download className="w-4 h-4" />
          <span>Xuất báo cáo CSV</span>
        </button>
      </div>

      <div className="soft-card p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Module Thống kê & Biểu đồ
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
          Các biểu đồ phân tích thành tích khoa học và thi đua cấp khoa/bộ môn sẽ được bổ sung ở Tuần 9 theo lộ trình.
        </p>
      </div>
    </div>
  );
}
