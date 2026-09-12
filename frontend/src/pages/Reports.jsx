import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  Calendar,
  Building2,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Sun,
  Moon,
  Users,
  Trophy,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import NotificationBell from '../components/common/NotificationBell';

const API_BASE = 'http://localhost:5000/api/v1';

export default function Reports() {
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' | 'awards'
  const [summaryData, setSummaryData] = useState({
    achievements: { VerifiedCount: 0, PendingCount: 0, RevokedCount: 0, TotalCount: 0 },
    awards: { RecordedCount: 0, IndividualCount: 0, UnitCount: 0, RevokedAwardCount: 0 },
  });

  // Filters
  const [yearFilter, setYearFilter] = useState('2024');
  const [unitFilter, setUnitFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Data lists
  const [achievements, setAchievements] = useState([]);
  const [awards, setAwards] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch(`${API_BASE}/units`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setUnits(data.data || []);
    } catch (e) {
      console.error('Error fetching units:', e);
    }
  };

  const fetchSummary = async () => {
    try {
      let url = `${API_BASE}/reports/summary?mode=unit`;
      if (yearFilter) url += `&year=${yearFilter}`;
      if (unitFilter) url += `&unitId=${unitFilter}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setSummaryData(data.data);
    } catch (e) {
      console.error('Error fetching summary:', e);
    }
  };

  const fetchAchievementsReport = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/reports/achievements?page=${pagination.page}&pageSize=${pagination.pageSize}`;
      if (yearFilter) url += `&year=${yearFilter}`;
      if (unitFilter) url += `&unitId=${unitFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setAchievements(data.data.items || []);
        setPagination(data.data.pagination);
      }
    } catch (e) {
      console.error('Error fetching achievements report:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAwardsReport = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/reports/awards?page=${pagination.page}&pageSize=${pagination.pageSize}`;
      if (yearFilter) url += `&year=${yearFilter}`;
      if (unitFilter) url += `&unitId=${unitFilter}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setAwards(data.data.items || []);
        setPagination(data.data.pagination);
      }
    } catch (e) {
      console.error('Error fetching awards report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchSummary();
    if (activeTab === 'achievements') {
      fetchAchievementsReport();
    } else {
      fetchAwardsReport();
    }
  }, [activeTab, yearFilter, unitFilter, categoryFilter, statusFilter, pagination.page]);

  // Handle Safe CSV Export (Rule 11)
  const handleExportCSV = () => {
    const token = localStorage.getItem('accessToken');
    let url = `${API_BASE}/reports/export?type=${activeTab}`;
    if (yearFilter) url += `&year=${yearFilter}`;
    if (unitFilter) url += `&unitId=${unitFilter}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    // Download using fetch with auth header to trigger browser save
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Bao-cao-${activeTab === 'achievements' ? 'thanh-tich' : 'khen-thuong'}-${yearFilter || 'tat-ca'}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error('Error exporting CSV:', err));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200';
      case 'SUBMITTED':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200';
      case 'NEED_CORRECTION':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200';
      case 'REVOKED':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200';
      case 'REJECTED':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Trung tâm Báo cáo & Kiểm toán Thi đua (Tuần 9)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Thống kê & Xuất Báo cáo Thi đua
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tổng hợp dữ liệu thành tích và kết quả khen thưởng theo quy chế LHU. Bảo vệ CSV an toàn chuẩn Rule 11.
          </p>
        </div>

        {/* Right Tools (Export Button, Bell, Theme) */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            id="export-csv-btn"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-soft-sm hover:shadow-soft-md hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file CSV (Rule 11)</span>
          </button>
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 shadow-soft-sm transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Four KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              HỢP LỆ (Ca 11)
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summaryData.achievements?.VerifiedCount || 0}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Tổng thành tích đã xác nhận (VERIFIED)
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
              HÀNG CHỜ
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summaryData.achievements?.PendingCount || 0}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Hồ sơ đang chờ thẩm định
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40">
              ĐỘC LẬP (Ca 7)
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summaryData.awards?.RecordedCount || 0}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Danh hiệu khen thưởng chính thức
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40">
              TẬP THỂ
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {summaryData.awards?.UnitCount || 0}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Khen thưởng cấp Đơn vị / Khoa
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Tabs Navigation */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft-sm space-y-4">
        {/* Top Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Year Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Năm công nhận
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
            >
              <option value="">Tất cả các năm</option>
              <option value="2024">Năm học 2024</option>
              <option value="2023">Năm học 2023</option>
              <option value="2022">Năm học 2022</option>
            </select>
          </div>

          {/* Unit Filter (Ca 8) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Đơn vị bối cảnh (Ca 8)
            </label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
            >
              <option value="">Toàn trường</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          {activeTab === 'achievements' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Danh mục thành tích
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="">Tất cả danh mục</option>
                <option value="RESEARCH">Nghiên cứu khoa học</option>
                <option value="TEACHING">Giảng dạy & Đào tạo</option>
                <option value="AWARD">Giải thưởng & Sáng kiến</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          {activeTab === 'achievements' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Trạng thái thẩm định
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="VERIFIED">Đã xác nhận (VERIFIED)</option>
                <option value="SUBMITTED">Chờ duyệt (SUBMITTED)</option>
                <option value="NEED_CORRECTION">Cần bổ sung (NEED_CORRECTION)</option>
                <option value="REVOKED">Đã thu hồi (REVOKED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'achievements'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Báo cáo Thành tích Số ({achievements.length})
            </button>
            <button
              onClick={() => setActiveTab('awards')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'awards'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Báo cáo Khen thưởng & Quyết định ({awards.length})
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Tổng cộng: <strong>{pagination.total}</strong> bản ghi
          </span>
        </div>
      </div>

      {/* 4. Data Tables */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-soft-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Đang tải dữ liệu báo cáo...</div>
        ) : activeTab === 'achievements' ? (
          /* Achievements Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Tên thành tích / Công trình</th>
                  <th className="py-4 px-5">Chủ thể kê khai</th>
                  <th className="py-4 px-5">Đơn vị bối cảnh (Ca 8)</th>
                  <th className="py-4 px-5">Năm</th>
                  <th className="py-4 px-5">Trạng thái</th>
                  <th className="py-4 px-5 text-right">Minh chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {achievements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      Không tìm thấy bản ghi thành tích nào theo bộ lọc
                    </td>
                  </tr>
                ) : (
                  achievements.map((a) => (
                    <tr key={a.Id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {a.Title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {a.TypeName} • <span className="font-semibold">{a.TypeCategory}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {a.SubjectName}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          {a.SubjectType}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {a.ContextUnitName}
                        </span>
                        <div className="font-mono text-[10px] text-slate-400">({a.ContextUnitCode})</div>
                      </td>

                      <td className="py-4 px-5 font-bold font-mono text-slate-700 dark:text-slate-300">
                        {a.RecognitionYear}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            a.Status
                          )}`}
                        >
                          {a.Status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px]">
                          {a.EvidenceCount} files
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Awards Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Danh hiệu / Hình thức</th>
                  <th className="py-4 px-5">Quyết định ban hành</th>
                  <th className="py-4 px-5">Chủ thể thụ hưởng</th>
                  <th className="py-4 px-5">Đơn vị bối cảnh</th>
                  <th className="py-4 px-5">Năm</th>
                  <th className="py-4 px-5 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {awards.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      Không tìm thấy danh hiệu khen thưởng nào theo bộ lọc
                    </td>
                  </tr>
                ) : (
                  awards.map((ar) => (
                    <tr key={ar.Id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {ar.AwardTypeName}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                          [{ar.AwardTypeCode}] • Cấp {ar.AwardLevel}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          {ar.DecisionNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Ngày ký: {ar.IssuedDate ? new Date(ar.IssuedDate).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {ar.SubjectName}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          {ar.SubjectType}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {ar.ContextUnitName}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-bold font-mono text-slate-700 dark:text-slate-300">
                        {ar.RecognitionYear}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            ar.Status
                          )}`}
                        >
                          {ar.Status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
