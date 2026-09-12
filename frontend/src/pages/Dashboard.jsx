import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Trophy,
  Microscope,
  Presentation,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Calendar as CalendarIcon,
  BookOpen,
  GraduationCap,
  Users,
  Check,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme();
  const [selectedDay, setSelectedDay] = useState(21);
  const [isJoined, setIsJoined] = useState(false);
  const [showAllRoadmap, setShowAllRoadmap] = useState(false);

  // Calendar dates for Month 4 (April)
  const calendarDays = [
    { day: 28, isPrevMonth: true },
    { day: 29, isPrevMonth: true },
    { day: 30, isPrevMonth: true },
    { day: 31, isPrevMonth: true },
    { day: 1 },
    { day: 2 },
    { day: 3 },
    { day: 4 },
    { day: 5 },
    { day: 6 },
    { day: 7, hasDot: true },
    { day: 8 },
    { day: 9 },
    { day: 10 },
    { day: 11 },
    { day: 12 },
    { day: 13 },
    { day: 14 },
    { day: 15 },
    { day: 16 },
    { day: 17 },
    { day: 18, hasDot: true },
    { day: 19 },
    { day: 20 },
    { day: 21, isSelected: true, hasEvent: true },
    { day: 22 },
    { day: 23 },
    { day: 24 },
  ];

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* 1. Header Row */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Chào mừng trở lại, Dr. Nguyễn Văn A!
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            12 Tháng 4, 2024, Thứ Hai
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thành tích..."
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-soft-darkCard border border-slate-100 dark:border-soft-darkBorder rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20 shadow-soft-sm transition-all"
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="p-2.5 rounded-2xl bg-white dark:bg-soft-darkCard border border-slate-100 dark:border-soft-darkBorder text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-soft-darkCardHover shadow-soft-sm transition-all"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* 2. Top Hero Grid: Hero Banner + Health Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hero Banner (8 cols) */}
        <div className="lg:col-span-8 rounded-[28px] bg-[#ebd9c3] dark:bg-[#2c241c] p-7 sm:p-9 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-soft-sm">
          {/* Decorative background blob */}
          <div className="absolute -right-8 -bottom-16 w-80 h-80 rounded-full bg-[#dfc5a7] dark:bg-[#3d3226] opacity-70 pointer-events-none" />

          <div className="relative z-10 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-amber-100 leading-snug">
              Hệ thống Quản lý <br />
              Thành tích & Dự báo AI
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-amber-200/80 mt-3 leading-relaxed">
              Chúng tôi giúp bạn theo dõi tiến độ nghiên cứu và giảng dạy một cách trực quan nhất.
            </p>
          </div>

          {/* 3D Illustration Avatar (Desk, books, student) */}
          <div className="absolute right-4 sm:right-8 bottom-0 w-44 sm:w-56 h-48 sm:h-52 z-10 pointer-events-none flex items-end justify-center">
            <svg
              viewBox="0 0 200 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-lg"
            >
              {/* Desk */}
              <rect x="20" y="140" width="160" height="20" rx="4" fill="#a07855" />
              <rect x="25" y="160" width="150" height="8" rx="2" fill="#7a5538" />
              {/* Stack of books */}
              <rect x="35" y="125" width="42" height="15" rx="3" fill="#3b82f6" />
              <rect x="33" y="110" width="44" height="15" rx="3" fill="#10b981" />
              <rect x="37" y="95" width="38" height="15" rx="3" fill="#f59e0b" />
              <rect x="34" y="80" width="42" height="15" rx="3" fill="#ef4444" />
              {/* Laptop */}
              <rect x="130" y="120" width="36" height="22" rx="2" fill="#cbd5e1" transform="skewY(-10)" />
              <rect x="126" y="138" width="42" height="4" rx="2" fill="#94a3b8" />
              {/* Person Body & Shirt */}
              <ellipse cx="110" cy="115" rx="30" ry="25" fill="#f97316" />
              <path d="M90 120 Q110 135 130 120" stroke="#fff" strokeWidth="4" fill="none" />
              {/* Open Notebook */}
              <path d="M85 135 L110 130 L135 135 L130 142 L110 138 L90 142 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
              {/* Head & Hair */}
              <circle cx="110" cy="65" r="22" fill="#fed7aa" />
              <path d="M92 60 C90 40 125 35 128 55 C120 50 115 50 110 52 C105 50 98 52 92 60 Z" fill="#472a1e" />
              {/* Eyes & Smile */}
              <circle cx="103" cy="66" r="2.5" fill="#1e293b" />
              <circle cx="117" cy="66" r="2.5" fill="#1e293b" />
              <path d="M107 74 Q110 77 113 74" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Cheeks */}
              <circle cx="100" cy="72" r="3" fill="#f87171" opacity="0.4" />
              <circle cx="120" cy="72" r="3" fill="#f87171" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Right Health Widget (4 cols) */}
        <div className="lg:col-span-4 rounded-[28px] bg-[#dff1f8] dark:bg-[#1a2c38] p-7 flex flex-col justify-between shadow-soft-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-cyan-100">
              Khám sức khỏe thành tích (AI)
            </h3>
            <p className="text-xs text-slate-500 dark:text-cyan-300/70 mt-0.5">
              Các tham số cần được cải thiện!
            </p>
          </div>

          <div className="space-y-4 my-auto py-2">
            {/* Metric 1 */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                <span>Nghiên cứu khoa học</span>
                <span className="font-bold text-slate-800 dark:text-white">82%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/70 dark:bg-slate-800/80 overflow-hidden">
                <div className="h-full rounded-full bg-[#5b86b8] transition-all duration-500" style={{ width: '82%' }} />
              </div>
            </div>

            {/* Metric 2 */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                <span>Giảng dạy</span>
                <span className="font-bold text-slate-800 dark:text-white">65%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/70 dark:bg-slate-800/80 overflow-hidden">
                <div className="h-full rounded-full bg-[#8fa46e] transition-all duration-500" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Metric 3 */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                <span>Dự báo CSTĐ Cơ sở</span>
                <span className="font-bold text-slate-800 dark:text-white">85%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/70 dark:bg-slate-800/80 overflow-hidden">
                <div className="h-full rounded-full bg-[#e58080] transition-all duration-500" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Khen thưởng */}
        <div className="soft-card p-5 flex items-center justify-between hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3 rounded-2xl bg-[#def3eb] dark:bg-emerald-950/40 text-[#15a878] flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Khen thưởng</div>
              <div className="text-xs text-slate-400 mt-0.5">Danh sách giải thưởng</div>
            </div>
          </div>
          <button
            title="Thêm khen thưởng"
            className="w-8 h-8 rounded-full bg-[#7ecdb3] hover:bg-[#68be9f] text-white flex items-center justify-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Nghiên cứu */}
        <div className="soft-card p-5 flex items-center justify-between hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3 rounded-2xl bg-[#e3f0fb] dark:bg-blue-950/40 text-[#3b82f6] flex items-center justify-center">
              <Microscope className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Nghiên cứu</div>
              <div className="text-xs text-slate-400 mt-0.5">Kho lưu trữ đề tài</div>
            </div>
          </div>
          <button
            title="Thêm đề tài nghiên cứu"
            className="w-8 h-8 rounded-full bg-[#83bbf5] hover:bg-[#68a7ec] text-white flex items-center justify-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Giảng dạy */}
        <div className="soft-card p-5 flex items-center justify-between hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3 rounded-2xl bg-[#fef5df] dark:bg-amber-950/40 text-[#d97706] flex items-center justify-center">
              <Presentation className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Giảng dạy</div>
              <div className="text-xs text-slate-400 mt-0.5">Lịch trình & giáo án</div>
            </div>
          </div>
          <button
            title="Thêm giáo án"
            className="w-8 h-8 rounded-full bg-[#f4b638] hover:bg-[#e2a225] text-white flex items-center justify-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Grid: Calendar + KPI Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Calendar (8 cols) */}
        <div className="lg:col-span-8 soft-card p-6 sm:p-8 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Lịch xét duyệt – Tháng 4
            </h3>
            <div className="flex items-center gap-1.5 text-slate-400">
              <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-4">
            <div>Thứ 2</div>
            <div>Thứ 3</div>
            <div>Thứ 4</div>
            <div>Thứ 5</div>
            <div>Thứ 6</div>
            <div>Thứ 7</div>
            <div>Chủ nhật</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
            {calendarDays.map((d, index) => {
              const isCurrentSelected = selectedDay === d.day && !d.isPrevMonth;

              return (
                <div key={index} className="relative flex flex-col items-center justify-center h-12">
                  <button
                    onClick={() => !d.isPrevMonth && setSelectedDay(d.day)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      d.isPrevMonth
                        ? 'text-slate-300 dark:text-slate-600 cursor-default'
                        : isCurrentSelected
                        ? 'bg-[#d8eef0] dark:bg-[#253d4c] text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                    }`}
                  >
                    {d.day}
                  </button>

                  {/* Yellow indicator dot */}
                  {d.hasDot && (
                    <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Event Popover Box on Day 21 (as shown in design) */}
          <div className="mt-6 sm:absolute sm:bottom-6 sm:right-6 sm:mt-0 w-full sm:w-72 p-4 rounded-2xl bg-white dark:bg-soft-darkCard border border-slate-200/80 dark:border-soft-darkBorder shadow-soft-lg z-20 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Hội đồng xét duyệt
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Phòng Hội thảo 1</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm">
                <Bell className="w-4 h-4 fill-white" />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-soft-darkBorder">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  11:30 – 12:30
                </div>
                <button
                  onClick={() => setIsJoined(!isJoined)}
                  className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mt-0.5"
                >
                  {isJoined ? (
                    <>
                      <Check className="w-3 h-3" /> Đã xác nhận tham gia
                    </>
                  ) : (
                    'Xác nhận tham gia'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right KPI Roadmap (4 cols) */}
        <div className="lg:col-span-4 soft-card p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-5">
              Gợi ý lộ trình KPI 2026–2027
            </h3>

            <div className="space-y-4">
              {/* Item 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-soft-darkBorder flex items-center gap-3.5 hover:shadow-soft-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    Xuất bản 02 giáo trình
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Hạn: 02/2027</div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-soft-darkBorder flex items-center gap-3.5 hover:shadow-soft-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    Hướng dẫn 03 nghiên cứu sinh
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Hạn: 02/2027</div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-soft-darkBorder flex items-center gap-3.5 hover:shadow-soft-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    Hội thảo Quốc tế Q1
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Hạn: 12/2026</div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>

              {/* Extra expandable items */}
              {showAllRoadmap && (
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-soft-darkBorder flex items-center gap-3.5 animate-fadeIn">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      Đăng ký 01 Bằng độc quyền sáng chế
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Hạn: 08/2027</div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowAllRoadmap(!showAllRoadmap)}
            className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors py-1"
          >
            <span>{showAllRoadmap ? 'Thu gọn' : 'Xem toàn bộ lộ trình'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showAllRoadmap ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
