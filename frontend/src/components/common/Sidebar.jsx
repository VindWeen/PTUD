import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Home,
  Award,
  Calendar,
  Cpu,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: Home, label: 'Trang chủ' },
    { to: '/profile', icon: Award, label: 'Hồ sơ năng lực' },
    { to: '/approvals', icon: Calendar, label: 'Lịch xét duyệt' },
    { to: '/ai-forecast', icon: Cpu, label: 'Dự báo AI' },
    { to: '/profile', icon: User, label: 'Tài khoản' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Floating Pill Sidebar (matching Page_Design) */}
      <aside className="hidden lg:flex fixed left-5 top-5 bottom-5 w-[76px] bg-soft-sidebar dark:bg-soft-sidebarDark rounded-[32px] flex-col items-center justify-between py-6 z-30 shadow-soft-lg text-white">
        {/* Top Logo (Graduation Cap) */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center gap-6 my-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip on hover */}
                <span className="absolute left-16 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Logout Button */}
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors group"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center group-hover:bg-rose-500/10 transition-all">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-bold tracking-wider">LOGOUT</span>
        </button>
      </aside>

      {/* Mobile Bottom Navigation Bar (matching Mobile design) */}
      <nav className="lg:hidden fixed bottom-3 left-4 right-4 h-16 bg-soft-sidebar/95 dark:bg-soft-sidebarDark/95 backdrop-blur-md rounded-full flex items-center justify-around px-2 z-40 shadow-soft-lg text-slate-400">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `p-3 rounded-full transition-colors ${isActive ? 'text-white bg-white/15' : 'hover:text-white'}`
          }
        >
          <Home className="w-5 h-5" />
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `p-3 rounded-full transition-colors ${isActive ? 'text-white bg-white/15' : 'hover:text-white'}`
          }
        >
          <Award className="w-5 h-5" />
        </NavLink>

        {/* Center elevated action button */}
        <NavLink
          to="/ai-forecast"
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 active:scale-95 transition-transform"
        >
          <Cpu className="w-6 h-6" />
        </NavLink>

        <NavLink
          to="/approvals"
          className={({ isActive }) =>
            `p-3 rounded-full transition-colors ${isActive ? 'text-white bg-white/15' : 'hover:text-white'}`
          }
        >
          <Calendar className="w-5 h-5" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="p-3 rounded-full hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>
    </>
  );
}
