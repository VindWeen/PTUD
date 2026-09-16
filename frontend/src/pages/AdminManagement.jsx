import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Building2,
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  Sun,
  Moon,
  RefreshCw,
  FolderTree,
  Award,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/common/NotificationBell';
import { MetricSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

const API_BASE = 'http://localhost:5000/api/v1';

export default function AdminManagement() {
  const { isDark, toggleTheme } = useTheme();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'units' | 'assignments'
  const [stats, setStats] = useState({
    TotalUsers: 0,
    ActiveUsers: 0,
    TotalLecturers: 0,
    TotalManagers: 0,
    ActiveRepresentatives: 0,
  });

  // Data states
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [units, setUnits] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(15);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState(null);
  const [showAuditDetailModal, setShowAuditDetailModal] = useState(false);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  const [showCreateUnitModal, setShowCreateUnitModal] = useState(false);
  const [showCreateScopeModal, setShowCreateScopeModal] = useState(false);
  const [showCreateRepModal, setShowCreateRepModal] = useState(false);

  // Form states
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: 'User@123456',
    isLecturer: true,
    staffCode: '',
    academicDegree: 'Thạc sĩ',
    academicTitle: '',
    roleIds: [2],
  });

  const [unitFormData, setUnitFormData] = useState({
    code: '',
    name: '',
    type: 'DEPARTMENT',
    parentId: '',
  });

  const [scopeFormData, setScopeFormData] = useState({
    userId: '',
    unitId: '',
    roleId: 3, // Manager
    includeDescendants: true,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '2026-12-31',
  });

  const [repFormData, setRepFormData] = useState({
    userId: '',
    unitId: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '2026-12-31',
    notes: '',
  });

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/stats`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      let url = `${API_BASE}/users?pageSize=50`;
      if (userSearch) url += `&keyword=${encodeURIComponent(userSearch)}`;
      if (roleFilter) url += `&roleCode=${encodeURIComponent(roleFilter)}`;
      if (statusFilter) url += `&isActive=${statusFilter}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setUsers(data.data.items || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/roles`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setRoles(data.data || []);
    } catch (e) {
      console.error('Error fetching roles:', e);
    }
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

  const fetchScopes = async () => {
    try {
      const res = await fetch(`${API_BASE}/units/scopes`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setScopes(data.data || []);
    } catch (e) {
      console.error('Error fetching scopes:', e);
    }
  };

  const fetchRepresentatives = async () => {
    try {
      const res = await fetch(`${API_BASE}/units/representatives`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setRepresentatives(data.data || []);
    } catch (e) {
      console.error('Error fetching reps:', e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchRoles(),
      fetchUnits(),
      fetchScopes(),
      fetchRepresentatives(),
    ]);
    setLoading(false);
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', auditPage);
      params.append('pageSize', auditPageSize);
      if (auditActionFilter) params.append('action', auditActionFilter);
      if (auditEntityFilter) params.append('entityType', auditEntityFilter);

      const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data || []);
        setAuditTotal(data.meta?.total || 0);
        setAuditTotalPages(data.meta?.totalPages || 1);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, auditPage, auditActionFilter, auditEntityFilter]);

  useEffect(() => {
    fetchUsers();
  }, [userSearch, roleFilter, statusFilter]);

  // Handlers for User Actions
  const handleToggleUserActive = async (user) => {
    try {
      const newStatus = !user.isActive;
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u)));
        fetchStats();
      }
    } catch (e) {
      console.error('Error toggling active:', e);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userFormData),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateUserModal(false);
        setUserFormData({
          username: '',
          email: '',
          fullName: '',
          password: 'User@123456',
          isLecturer: true,
          staffCode: '',
          academicDegree: 'Thạc sĩ',
          academicTitle: '',
          roleIds: [2],
        });
        loadAllData();
      } else {
        alert(data.message || 'Lỗi tạo người dùng');
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const handleOpenAssignRoles = (u) => {
    setSelectedUserForRoles(u);
    setSelectedRoleIds(u.roles ? u.roles.map((r) => r.Id || r.id) : []);
    setShowAssignRoleModal(true);
  };

  const handleSaveRoles = async () => {
    if (!selectedUserForRoles) return;
    try {
      const res = await fetch(`${API_BASE}/users/${selectedUserForRoles.id}/roles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAssignRoleModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error('Error saving roles:', err);
    }
  };

  // Handlers for Unit Actions
  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/units`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...unitFormData,
          parentId: unitFormData.parentId ? parseInt(unitFormData.parentId, 10) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateUnitModal(false);
        setUnitFormData({ code: '', name: '', type: 'DEPARTMENT', parentId: '' });
        fetchUnits();
      }
    } catch (err) {
      console.error('Error creating unit:', err);
    }
  };

  // Handlers for Scope Actions
  const handleCreateScope = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/units/scopes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId: parseInt(scopeFormData.userId, 10),
          unitId: parseInt(scopeFormData.unitId, 10),
          roleId: parseInt(scopeFormData.roleId, 10),
          includeDescendants: scopeFormData.includeDescendants,
          validFrom: scopeFormData.validFrom,
          validTo: scopeFormData.validTo || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateScopeModal(false);
        fetchScopes();
        fetchStats();
      }
    } catch (err) {
      console.error('Error creating scope:', err);
    }
  };

  const handleDeleteScope = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy phân công phạm vi duyệt này?')) return;
    try {
      const res = await fetch(`${API_BASE}/units/scopes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchScopes();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting scope:', err);
    }
  };

  // Handlers for Representative Actions
  const handleCreateRep = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/units/representatives`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId: parseInt(repFormData.userId, 10),
          unitId: parseInt(repFormData.unitId, 10),
          validFrom: repFormData.validFrom,
          validTo: repFormData.validTo || null,
          notes: repFormData.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateRepModal(false);
        fetchRepresentatives();
        fetchStats();
      }
    } catch (err) {
      console.error('Error creating representative:', err);
    }
  };

  const handleDeactivateRep = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa phân công đại diện này?')) return;
    try {
      const res = await fetch(`${API_BASE}/units/representatives/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchRepresentatives();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deactivating rep:', err);
    }
  };

  const getRoleBadge = (roleCode, roleName) => {
    switch (roleCode) {
      case 'ADMIN':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'MANAGER':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'RECORDS_OFFICER':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Phân hệ Quản trị Trung tâm (Tuần 8)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Quản trị & Phân công Hệ thống
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Quản lý tài khoản, phân quyền vai trò, cơ cấu tổ chức và phân công đại diện kê khai thành tích.
          </p>
        </div>

        {/* Right Tools (Bell & Theme) */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors shadow-soft-sm"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={loadAllData}
            title="Tải lại dữ liệu"
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors shadow-soft-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      {error ? (
        <ErrorState message={error} onRetry={loadAllData} />
      ) : loading ? (
        <MetricSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {stats.ActiveUsers} hoạt động
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.TotalUsers}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Tổng tài khoản người dùng
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {units.filter((u) => u.type === 'FACULTY').length} Khoa
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {units.length}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Đơn vị & Bộ môn đào tạo
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {scopes.length} phân công
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.TotalManagers}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Cán bộ quản lý thẩm định
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
              Rule 2 active
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.ActiveRepresentatives}
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Đại diện nộp thành tích tập thể
          </div>
        </div>
      </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Người dùng & Phân quyền ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'units'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Cơ cấu Đơn vị ({units.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Phân công Thẩm định & Đại diện ({scopes.length + representatives.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Nhật ký Kiểm toán ({auditTotal})
        </button>
      </div>

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo username, họ tên, email, mã GV..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-brand-500 transition-colors shadow-soft-sm"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none shadow-soft-sm"
              >
                <option value="">Tất cả vai trò</option>
                {roles.map((r) => (
                  <option key={r.Id} value={r.Code}>
                    {r.Name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm Người dùng
            </button>
          </div>

          {/* Users Table */}
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Không tìm thấy người dùng phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc chọn vai trò khác để xem thêm kết quả."
              actionLabel={userSearch || roleFilter || statusFilter ? 'Xóa bộ lọc' : undefined}
              onAction={userSearch || roleFilter || statusFilter ? () => { setUserSearch(''); setRoleFilter(''); setStatusFilter(''); } : undefined}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-soft-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="py-4 px-5">Người dùng</th>
                      <th className="py-4 px-5">Mã GV / Đơn vị</th>
                      <th className="py-4 px-5">Vai trò hệ thống</th>
                      <th className="py-4 px-5">Trạng thái</th>
                      <th className="py-4 px-5 text-right">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-purple-600/20 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-sm shadow-sm">
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {u.fullName}
                              {u.username === currentUser?.username && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-600 font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">@{u.username} • {u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {u.staffCode ? (
                          <div>
                            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {u.staffCode}
                            </span>
                            <div className="text-xs text-slate-400">
                              {u.academicTitle ? `${u.academicTitle} ` : ''}{u.academicDegree || ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa liên kết GV</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((r) => (
                              <span
                                key={r.Id}
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getRoleBadge(
                                  r.Code,
                                  r.Name
                                )}`}
                              >
                                {r.Name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Không có</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                            <XCircle className="w-3.5 h-3.5" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenAssignRoles(u)}
                            title="Phân quyền vai trò"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                            className={`p-2 rounded-xl transition-colors ${
                              u.isActive
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: UNITS TREE */}
      {activeTab === 'units' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sơ đồ cơ cấu tổ chức phân cấp Khoa - Bộ môn phục vụ thẩm định hồ sơ và kê khai thành tích tập thể.
            </p>
            <button
              onClick={() => setShowCreateUnitModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-sm flex items-center gap-2 shadow-soft-sm hover:shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm Đơn vị / Bộ môn
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {units
              .filter((u) => u.type === 'FACULTY')
              .map((faculty) => {
                const subDepts = units.filter((sub) => sub.parentId === faculty.id);
                return (
                  <div
                    key={faculty.id}
                    className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft-sm space-y-4"
                  >
                    {/* Faculty Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-900 dark:text-white">
                              {faculty.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              {faculty.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Cấp Khoa / Viện đào tạo • {faculty.memberCount || 0} giảng viên
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Active Representatives of Faculty */}
                    {faculty.activeRepresentatives && faculty.activeRepresentatives.length > 0 && (
                      <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Đại diện tập thể đương nhiệm:{' '}
                          <strong>{faculty.activeRepresentatives.map((r) => r.FullName).join(', ')}</strong>
                        </span>
                      </div>
                    )}

                    {/* Sub Departments */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Bộ môn trực thuộc ({subDepts.length})
                      </div>
                      {subDepts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Chưa có bộ môn trực thuộc</p>
                      ) : (
                        <div className="space-y-1.5">
                          {subDepts.map((dept) => (
                            <div
                              key={dept.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {dept.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  ({dept.code})
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {dept.activeRepresentatives?.length > 0 ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Có đại diện
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Chưa có đại diện</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS (SCOPES & REPRESENTATIVES) */}
      {activeTab === 'assignments' && (
        <div className="space-y-8">
          {/* Section 1: User Unit Scopes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Phân công Phạm vi Thẩm định (UserUnitScopes)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quy định phạm vi đơn vị mà Cán bộ quản lý (Manager) được phép thẩm định hồ sơ thành tích.
                </p>
              </div>
              <button
                onClick={() => setShowCreateScopeModal(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Phân công Thẩm định
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Cán bộ Quản lý</th>
                    <th className="py-3 px-4">Đơn vị Thẩm định</th>
                    <th className="py-3 px-4">Bao gồm Đơn vị con</th>
                    <th className="py-3 px-4">Thời hạn Hiệu lực</th>
                    <th className="py-3 px-4 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {scopes.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {s.userName} <span className="font-mono text-slate-400 font-normal">(@{s.username})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {s.unitName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 ml-1">({s.unitCode})</span>
                      </td>
                      <td className="py-3 px-4">
                        {s.includeDescendants ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 text-[10px] font-bold">
                            KÈM BỘ MÔN CON
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                            CHỈ ĐƠN VỊ NÀY
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {s.validFrom?.split('T')[0]} → {s.validTo ? s.validTo.split('T')[0] : 'Vô thời hạn'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteScope(s.id)}
                          title="Hủy phân công"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Unit Representatives (Rule 2) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                  Đại diện Đơn vị Kê khai Thành tích Tập thể (Rule 2)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân công giảng viên đại diện nộp hồ sơ thành tích cho Khoa/Bộ môn. Hết hạn sẽ bị chặn (Rule 2).
                </p>
              </div>
              <button
                onClick={() => setShowCreateRepModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Phân công Đại diện
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Giảng viên Đại diện</th>
                    <th className="py-3 px-4">Đơn vị Đại diện</th>
                    <th className="py-3 px-4">Nhiệm kỳ / Thời hạn</th>
                    <th className="py-3 px-4">Trạng thái (Rule 2)</th>
                    <th className="py-3 px-4 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {representatives.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {rep.userName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {rep.staffCode || rep.username}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {rep.unitName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 ml-1">({rep.unitCode})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {rep.validFrom?.split('T')[0]} → {rep.validTo ? rep.validTo.split('T')[0] : 'Vô thời hạn'}
                      </td>
                      <td className="py-3 px-4">
                        {rep.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            ĐANG HIỆU LỰC
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px]">
                            HẾT HIỆU LỰC
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rep.isActive && (
                          <button
                            onClick={() => handleDeactivateRep(rep.id)}
                            title="Vô hiệu hóa đại diện"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-5">
          {/* Action Bar & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none shadow-soft-sm font-medium"
              >
                <option value="">Tất cả Hành động</option>
                <option value="ACHIEVEMENT_VERIFY">Xác nhận Thành tích (VERIFY)</option>
                <option value="ACHIEVEMENT_REQUEST_CORRECTION">Yêu cầu Bổ sung</option>
                <option value="ACHIEVEMENT_REJECT">Từ chối Thành tích</option>
                <option value="ACHIEVEMENT_REVOKE">Thu hồi Thành tích</option>
                <option value="AWARD_RECORD_CREATE">Ghi nhận Khen thưởng</option>
                <option value="AWARD_RECORD_REVOKE">Thu hồi Khen thưởng</option>
                <option value="SCOPE_ASSIGN">Phân công Phạm vi Duyệt</option>
                <option value="SCOPE_DELETE">Hủy Phạm vi Duyệt</option>
                <option value="REPRESENTATIVE_ASSIGN">Bổ nhiệm Đại diện</option>
                <option value="REPRESENTATIVE_DEACTIVATE">Hủy Đại diện</option>
                <option value="USER_CREATE">Tạo Tài khoản Mới</option>
                <option value="USER_UPDATE">Cập nhật Tài khoản</option>
              </select>

              <select
                value={auditEntityFilter}
                onChange={(e) => {
                  setAuditEntityFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none shadow-soft-sm font-medium"
              >
                <option value="">Tất cả Thực thể</option>
                <option value="ACHIEVEMENT">Hồ sơ Thành tích</option>
                <option value="AWARD_RECORD">Sổ Khen thưởng</option>
                <option value="SCOPE">Phạm vi Duyệt</option>
                <option value="REPRESENTATIVE">Đại diện Đơn vị</option>
                <option value="USER">Người dùng</option>
              </select>

              <button
                onClick={() => {
                  setAuditActionFilter('');
                  setAuditEntityFilter('');
                  setAuditPage(1);
                }}
                className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Trang {auditPage} / {auditTotalPages} ({auditTotal} nhật ký)
              </span>
              <button
                disabled={auditPage <= 1 || auditLoading}
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Trước
              </button>
              <button
                disabled={auditPage >= auditTotalPages || auditLoading}
                onClick={() => setAuditPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Sau
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-xs border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4">Người thực hiện</th>
                    <th className="py-3.5 px-4">Hành động</th>
                    <th className="py-3.5 px-4">Đối tượng</th>
                    <th className="py-3.5 px-4">Địa chỉ IP</th>
                    <th className="py-3.5 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {auditLoading ? (
                    <tr>
                      <td colSpan="6" className="p-4">
                        <TableSkeleton rows={5} cols={6} />
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6">
                        <EmptyState
                          icon={History}
                          title="Chưa có nhật ký kiểm toán phù hợp"
                          description="Không tìm thấy bản ghi nhật ký kiểm toán nào theo bộ lọc hành động hoặc loại thực thể hiện tại."
                          actionLabel={auditActionFilter || auditEntityFilter ? 'Xóa bộ lọc' : undefined}
                          onAction={auditActionFilter || auditEntityFilter ? () => { setAuditActionFilter(''); setAuditEntityFilter(''); } : undefined}
                        />
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                      if (log.Action.includes('VERIFY') || log.Action.includes('CONFIRM') || log.Action.includes('CREATE')) {
                        badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40';
                      } else if (log.Action.includes('REVOKE') || log.Action.includes('REJECT') || log.Action.includes('DELETE')) {
                        badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40';
                      } else if (log.Action.includes('CORRECTION') || log.Action.includes('UPDATE')) {
                        badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40';
                      } else if (log.Action.includes('ASSIGN')) {
                        badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40';
                      }

                      return (
                        <tr key={log.Id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">
                            {new Date(log.CreatedAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">
                              {log.FullName || 'Hệ thống'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              @{log.Username || 'system'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${badgeColor}`}>
                              {log.Action}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                              {log.EntityType}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: #{log.EntityId}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">
                            {log.IpAddress || 'localhost'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedLogForDetail(log);
                                setShowAuditDetailModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
                            >
                              Xem Diff
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-soft-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Thêm Người dùng Mới
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  placeholder="e.g. lehoangtuan"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  placeholder="e.g. ThS. Lê Hoàng Tuấn"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Email LHU *
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="e.g. tuanlh@lhu.edu.vn"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Mã Giảng viên
                  </label>
                  <input
                    type="text"
                    value={userFormData.staffCode}
                    onChange={(e) => setUserFormData({ ...userFormData, staffCode: e.target.value })}
                    placeholder="e.g. GV_CNTT_05"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Học vị
                  </label>
                  <select
                    value={userFormData.academicDegree}
                    onChange={(e) => setUserFormData({ ...userFormData, academicDegree: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                  >
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Cử nhân">Cử nhân</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md"
                >
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN ROLES */}
      {showAssignRoleModal && selectedUserForRoles && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-soft-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Phân quyền Vai trò
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cán bộ: <strong>{selectedUserForRoles.fullName}</strong> (@{selectedUserForRoles.username})
            </p>

            <div className="space-y-2 mb-6">
              {roles.map((role) => {
                const isChecked = selectedRoleIds.includes(role.Id);
                return (
                  <label
                    key={role.Id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500/40 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoleIds([...selectedRoleIds, role.Id]);
                        } else {
                          setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.Id));
                        }
                      }}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <div className="font-semibold text-xs">{role.Name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{role.Code}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAssignRoleModal(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveRoles}
                className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md"
              >
                Lưu quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE UNIT */}
      {showCreateUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-soft-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Thêm Đơn vị / Bộ môn Mới
            </h3>
            <form onSubmit={handleCreateUnit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mã đơn vị *
                </label>
                <input
                  type="text"
                  required
                  value={unitFormData.code}
                  onChange={(e) => setUnitFormData({ ...unitFormData, code: e.target.value })}
                  placeholder="e.g. BM_AI"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tên đơn vị *
                </label>
                <input
                  type="text"
                  required
                  value={unitFormData.name}
                  onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  placeholder="e.g. Bộ môn Trí tuệ Nhân tạo"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Loại đơn vị
                </label>
                <select
                  value={unitFormData.type}
                  onChange={(e) => setUnitFormData({ ...unitFormData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                >
                  <option value="DEPARTMENT">Bộ môn trực thuộc</option>
                  <option value="FACULTY">Khoa / Viện đào tạo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Đơn vị cha (Thuộc Khoa nào?)
                </label>
                <select
                  value={unitFormData.parentId}
                  onChange={(e) => setUnitFormData({ ...unitFormData, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                >
                  <option value="">Không có (Cấp cao nhất)</option>
                  {units
                    .filter((u) => u.type === 'FACULTY')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateUnitModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md"
                >
                  Tạo đơn vị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SCOPE */}
      {showCreateScopeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-soft-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Phân công Phạm vi Thẩm định Hồ sơ
            </h3>
            <form onSubmit={handleCreateScope} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cán bộ Quản lý (Manager) *
                </label>
                <select
                  required
                  value={scopeFormData.userId}
                  onChange={(e) => setScopeFormData({ ...scopeFormData, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                >
                  <option value="">-- Chọn Cán bộ --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Đơn vị phụ trách *
                </label>
                <select
                  required
                  value={scopeFormData.unitId}
                  onChange={(e) => setScopeFormData({ ...scopeFormData, unitId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                >
                  <option value="">-- Chọn Đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="incDesc"
                  checked={scopeFormData.includeDescendants}
                  onChange={(e) =>
                    setScopeFormData({ ...scopeFormData, includeDescendants: e.target.checked })
                  }
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="incDesc" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Bao gồm tất cả Bộ môn con trực thuộc đơn vị này
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={scopeFormData.validFrom}
                    onChange={(e) => setScopeFormData({ ...scopeFormData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={scopeFormData.validTo}
                    onChange={(e) => setScopeFormData({ ...scopeFormData, validTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateScopeModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md"
                >
                  Lưu phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE REPRESENTATIVE (RULE 2) */}
      {showCreateRepModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-soft-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Phân công Đại diện Đơn vị (Rule 2)
            </h3>
            <form onSubmit={handleCreateRep} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Giảng viên được ủy quyền đại diện *
                </label>
                <select
                  required
                  value={repFormData.userId}
                  onChange={(e) => setRepFormData({ ...repFormData, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                >
                  <option value="">-- Chọn Giảng viên --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} {u.staffCode ? `(${u.staffCode})` : `(@${u.username})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Đơn vị ủy quyền đại diện *
                </label>
                <select
                  required
                  value={repFormData.unitId}
                  onChange={(e) => setRepFormData({ ...repFormData, unitId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                >
                  <option value="">-- Chọn Đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ngày bắt đầu nhiệm kỳ
                  </label>
                  <input
                    type="date"
                    value={repFormData.validFrom}
                    onChange={(e) => setRepFormData({ ...repFormData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ngày kết thúc nhiệm kỳ
                  </label>
                  <input
                    type="date"
                    value={repFormData.validTo}
                    onChange={(e) => setRepFormData({ ...repFormData, validTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Ghi chú quyết định phân công
                </label>
                <textarea
                  rows="2"
                  value={repFormData.notes}
                  onChange={(e) => setRepFormData({ ...repFormData, notes: e.target.value })}
                  placeholder="e.g. Quyết định phân công phụ trách thi đua khen thưởng bộ môn năm học 2024-2026..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateRepModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md"
                >
                  Lưu đại diện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AUDIT LOG DETAIL & JSON DIFF */}
      {showAuditDetailModal && selectedLogForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-2xl w-full border border-slate-100 dark:border-slate-800 shadow-soft-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Chi tiết Nhật ký Kiểm toán #{selectedLogForDetail.Id}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hành động: <strong className="text-brand-600">{selectedLogForDetail.Action}</strong> | Thời gian: {new Date(selectedLogForDetail.CreatedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setShowAuditDetailModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 text-xs flex-1">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <span className="text-slate-400 block mb-0.5">Người thực hiện</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedLogForDetail.FullName} (@{selectedLogForDetail.Username})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Thực thể tác động</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedLogForDetail.EntityType} #{selectedLogForDetail.EntityId}
                  </span>
                </div>
              </div>

              {/* Diff View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    Dữ liệu trước (Old Values)
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-amber-200 font-mono text-[11px] overflow-x-auto max-h-60">
                    {selectedLogForDetail.OldValues ? JSON.stringify(selectedLogForDetail.OldValues, null, 2) : 'null (Khởi tạo mới)'}
                  </pre>
                </div>

                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                    Dữ liệu sau (New Values)
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-200 font-mono text-[11px] overflow-x-auto max-h-60">
                    {selectedLogForDetail.NewValues ? JSON.stringify(selectedLogForDetail.NewValues, null, 2) : 'null (Xóa / Hủy)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditDetailModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs shadow-md"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
