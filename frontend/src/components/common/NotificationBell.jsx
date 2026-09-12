import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch('http://localhost:5000/api/v1/notifications?pageSize=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.items || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling mỗi 15s

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id, actionUrl, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`http://localhost:5000/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev =>
        prev.map(n => (n.Id === id ? { ...n, IsRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      if (actionUrl) {
        setIsOpen(false);
        navigate(actionUrl);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('http://localhost:5000/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    } catch {
      return dateStr;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <Check className="w-4 h-4 text-emerald-500" />;
      case 'WARNING':
      case 'ACTION_REQUIRED':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'AWARD':
        return <Award className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        id="notification-bell-btn"
        title="Thông báo nội bộ"
        className="relative w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/30 transition-all shadow-soft-sm active:scale-95"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Các cập nhật về hồ sơ và khen thưởng sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.Id}
                  onClick={() => handleMarkAsRead(n.Id, n.ActionUrl)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex gap-3 items-start ${
                    !n.IsRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex-shrink-0 mt-0.5">
                    {getTypeIcon(n.Type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className={`text-xs font-semibold truncate ${!n.IsRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {n.Title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatTime(n.CreatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.Message}
                    </p>
                  </div>
                  {!n.IsRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
