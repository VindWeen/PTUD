import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Award,
  Plus,
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Building2,
  User,
  X,
  Eye,
  ShieldCheck,
  Calendar,
  Layers,
  Send,
  Edit3,
  XCircle,
  RotateCcw,
  CornerUpLeft,
} from 'lucide-react';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

export default function Achievements() {
  const { user } = useAuth();

  // Data states
  const [achievements, setAchievements] = useState([]);
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL'); // 'ALL' | 'PERSONAL' | 'UNIT'

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailAchievement, setDetailAchievement] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    recognitionYear: new Date().getFullYear(),
    achievementTypeId: '',
    startDate: '',
    endDate: '',
  });

  // Cancel Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Resubmit Modal states
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitTarget, setResubmitTarget] = useState(null);
  const [resubmitNotes, setResubmitNotes] = useState('');

  // Form states for Create
  const [formData, setFormData] = useState({
    ownerType: 'PERSONAL', // 'PERSONAL' hoặc 'UNIT'
    organizationUnitId: '',
    achievementTypeId: '',
    title: '',
    description: '',
    recognitionYear: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    evidenceName: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Additional file upload in detail modal
  const [extraFile, setExtraFile] = useState(null);
  const [extraFileName, setExtraFileName] = useState('');
  const [isUploadingExtra, setIsUploadingExtra] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [achieveRes, typesRes, unitsRes] = await Promise.all([
        api.get('/achievements'),
        api.get('/achievements/types').catch(() => ({ data: [] })),
        api.get('/units').catch(() => ({ data: [] })),
      ]);

      setAchievements(achieveRes.data || []);
      setTypes(typesRes.data || []);
      setUnits(unitsRes.data || []);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu:', err);
      const errMsg = err.response?.data?.error?.message || err.message || 'Không thể tải danh sách thành tích.';
      setError(errMsg);
      setFeedback({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.achievementTypeId) {
      setFeedback({ type: 'error', text: 'Vui lòng chọn loại thành tích.' });
      return;
    }
    if (!formData.title.trim()) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập tiêu đề thành tích.' });
      return;
    }
    if (formData.ownerType === 'UNIT' && !formData.organizationUnitId) {
      setFeedback({ type: 'error', text: 'Vui lòng chọn đơn vị tập thể.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // 1. Tạo bản ghi Achievement
      const payload = {
        achievementTypeId: parseInt(formData.achievementTypeId, 10),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        recognitionYear: parseInt(formData.recognitionYear, 10),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        organizationUnitId: formData.ownerType === 'UNIT' ? parseInt(formData.organizationUnitId, 10) : null,
      };

      const res = await api.post('/achievements', payload);
      const newAchievement = res.data;

      // 2. Upload file minh chứng nếu có chọn
      if (selectedFile && newAchievement?.Id) {
        const uploadForm = new FormData();
        uploadForm.append('file', selectedFile);
        uploadForm.append('name', formData.evidenceName || selectedFile.name);

        const token = localStorage.getItem('accessToken');
        await axios.post(`/api/v1/evidences/achievements/${newAchievement.Id}`, uploadForm, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setFeedback({
        type: 'success',
        text: `Đã tạo thành công bản nháp thành tích "${formData.title}"${selectedFile ? ' kèm minh chứng số' : ''}!`,
      });

      setShowCreateModal(false);
      setSelectedFile(null);
      setFormData({
        ownerType: 'PERSONAL',
        organizationUnitId: '',
        achievementTypeId: '',
        title: '',
        description: '',
        recognitionYear: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        evidenceName: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi tạo hồ sơ thành tích',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bản nháp thành tích "${title}"?`)) return;

    try {
      await api.delete(`/achievements/${id}`);
      setFeedback({ type: 'success', text: `Đã xóa bản nháp "${title}".` });
      loadData();
      if (detailAchievement?.Id === id) {
        setDetailAchievement(null);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Không thể xóa bản nháp',
      });
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const [res, histRes] = await Promise.all([
        api.get(`/achievements/${id}`),
        api.get(`/achievements/${id}/history`).catch(() => ({ data: [] })),
      ]);
      setDetailAchievement(res.data);
      setHistoryList(histRes.data || []);
    } catch (err) {
      setFeedback({ type: 'error', text: 'Không thể lấy thông tin chi tiết.' });
    }
  };

  // Nộp duyệt (DRAFT -> SUBMITTED)
  const handleSubmitForApproval = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn nộp hồ sơ "${title}" để Cán bộ quản lý xét duyệt? Sau khi nộp, hồ sơ sẽ chuyển sang trạng thái Chờ duyệt (SUBMITTED).`)) return;

    try {
      await api.post(`/achievements/${id}/submit`);
      setFeedback({
        type: 'success',
        text: `Đã nộp thành công hồ sơ "${title}" để xét duyệt!`,
      });
      loadData();
      if (detailAchievement?.Id === id) {
        handleOpenDetail(id);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi nộp hồ sơ xét duyệt',
      });
    }
  };

  // Mở modal sửa thông tin
  const handleOpenEdit = (achievement) => {
    setEditTarget(achievement);
    setEditFormData({
      title: achievement.Title || '',
      description: achievement.Description || '',
      recognitionYear: achievement.RecognitionYear || new Date().getFullYear(),
      achievementTypeId: achievement.AchievementTypeId || '',
      startDate: achievement.StartDate ? achievement.StartDate.split('T')[0] : '',
      endDate: achievement.EndDate ? achievement.EndDate.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  // Lưu sửa thông tin
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsSubmitting(true);
    try {
      await api.patch(`/achievements/${editTarget.Id}`, {
        ...editFormData,
        achievementTypeId: parseInt(editFormData.achievementTypeId, 10),
        recognitionYear: parseInt(editFormData.recognitionYear, 10),
        rowVersion: editTarget.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: `Đã cập nhật thành công thông tin hồ sơ "${editFormData.title}"!`,
      });
      setShowEditModal(false);
      setEditTarget(null);
      loadData();
      if (detailAchievement?.Id === editTarget.Id) {
        handleOpenDetail(editTarget.Id);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi cập nhật hồ sơ',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal nộp lại (Resubmit)
  const handleOpenResubmit = (achievement) => {
    setResubmitTarget(achievement);
    setResubmitNotes('');
    setShowResubmitModal(true);
  };

  // Xác nhận nộp lại
  const handleConfirmResubmit = async (e) => {
    e.preventDefault();
    if (!resubmitTarget) return;

    setIsSubmitting(true);
    try {
      await api.post(`/achievements/${resubmitTarget.Id}/submit`, {
        notes: resubmitNotes.trim() || 'Bổ sung và nộp lại hồ sơ xét duyệt',
        rowVersion: resubmitTarget.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: `Đã nộp lại thành công hồ sơ "${resubmitTarget.Title}"!`,
      });
      setShowResubmitModal(false);
      setResubmitTarget(null);
      loadData();
      if (detailAchievement?.Id === resubmitTarget.Id) {
        handleOpenDetail(resubmitTarget.Id);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi nộp lại hồ sơ',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal hủy hồ sơ
  const handleOpenCancel = (achievement) => {
    setCancelTarget(achievement);
    setCancelReason('');
    setShowCancelModal(true);
  };

  // Xác nhận hủy hồ sơ
  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;

    setIsSubmitting(true);
    try {
      await api.post(`/achievements/${cancelTarget.Id}/cancel`, {
        reason: cancelReason.trim(),
        rowVersion: cancelTarget.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: `Đã hủy thành công hồ sơ "${cancelTarget.Title}"!`,
      });
      setShowCancelModal(false);
      setCancelTarget(null);
      loadData();
      if (detailAchievement?.Id === cancelTarget.Id) {
        handleOpenDetail(cancelTarget.Id);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi hủy hồ sơ',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`/api/v1/evidences/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Không thể tải file: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleUploadExtraFile = async (e) => {
    e.preventDefault();
    if (!extraFile || !detailAchievement) return;

    setIsUploadingExtra(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', extraFile);
      uploadForm.append('name', extraFileName || extraFile.name);

      const token = localStorage.getItem('accessToken');
      await axios.post(`/api/v1/evidences/achievements/${detailAchievement.Id}`, uploadForm, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      // Reload detail & full list
      const res = await api.get(`/achievements/${detailAchievement.Id}`);
      setDetailAchievement(res.data);
      setExtraFile(null);
      setExtraFileName('');
      loadData();
    } catch (err) {
      alert('Lỗi đính kèm file: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsUploadingExtra(false);
    }
  };

  // Filtered achievements
  const filteredAchievements = achievements.filter((a) => {
    const matchSearch =
      !search ||
      a.Title.toLowerCase().includes(search.toLowerCase()) ||
      (a.LecturerName && a.LecturerName.toLowerCase().includes(search.toLowerCase())) ||
      (a.UnitName && a.UnitName.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = !statusFilter || a.Status === statusFilter;

    const matchOwner =
      ownerFilter === 'ALL' ||
      (ownerFilter === 'PERSONAL' && a.LecturerId) ||
      (ownerFilter === 'UNIT' && a.OrganizationUnitId);

    return matchSearch && matchStatus && matchOwner;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Đã xác nhận
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20">
            <Clock className="w-3 h-3" />
            Chờ xét duyệt
          </span>
        );
      case 'NEED_CORRECTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            Cần bổ sung
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Từ chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <X className="w-3 h-3" />
            Đã hủy
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/20">
            <CornerUpLeft className="w-3 h-3" />
            Đã thu hồi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Bản nháp (DRAFT)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            Hồ sơ Thành tích Cá nhân & Tập thể
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kê khai bài báo quốc tế (Q1/Q2), đề tài NCKH, sáng chế, giải thưởng và quản lý vòng đời hồ sơ minh chứng số.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="soft-btn-primary text-xs self-start sm:self-auto py-2.5 px-4 shadow-soft-sm hover:scale-[1.02] transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Kê khai thành tích mới</span>
        </button>
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="soft-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên thành tích, tác giả hoặc đơn vị..."
            className="soft-input w-full pl-10 text-xs"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Owner Tab */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setOwnerFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                ownerFilter === 'ALL'
                  ? 'bg-white dark:bg-soft-darkCard text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setOwnerFilter('PERSONAL')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                ownerFilter === 'PERSONAL'
                  ? 'bg-white dark:bg-soft-darkCard text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Cá nhân
            </button>
            <button
              onClick={() => setOwnerFilter('UNIT')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                ownerFilter === 'UNIT'
                  ? 'bg-white dark:bg-soft-darkCard text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Tập thể
            </button>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="soft-input py-1.5 px-3 text-xs w-auto"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="SUBMITTED">Chờ duyệt (SUBMITTED)</option>
            <option value="NEED_CORRECTION">Cần bổ sung (NEED_CORRECTION)</option>
            <option value="VERIFIED">Đã xác nhận (VERIFIED)</option>
            <option value="REJECTED">Từ chối (REJECTED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            <option value="REVOKED">Đã thu hồi (REVOKED)</option>
          </select>
        </div>
      </div>

      {/* Main Grid Content */}
      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : filteredAchievements.length === 0 ? (
        <EmptyState
          icon={Award}
          title={search || statusFilter || ownerFilter !== 'ALL' ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có hồ sơ thành tích nào'}
          description={
            search || statusFilter || ownerFilter !== 'ALL'
              ? 'Không có kết quả nào khớp với bộ lọc hiện tại. Thử xóa hoặc điều chỉnh bộ lọc để xem các hồ sơ khác.'
              : 'Bắt đầu bằng cách bấm nút "Kê khai thành tích mới" để lưu trữ các bài báo, đề tài và tài liệu minh chứng số an toàn.'
          }
          actionLabel={search || statusFilter || ownerFilter !== 'ALL' ? 'Xóa bộ lọc' : 'Kê khai ngay'}
          actionIcon={search || statusFilter || ownerFilter !== 'ALL' ? RotateCcw : Plus}
          onAction={
            search || statusFilter || ownerFilter !== 'ALL'
              ? () => {
                  setSearch('');
                  setStatusFilter('');
                  setOwnerFilter('ALL');
                }
              : () => setShowCreateModal(true)
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((item) => (
            <div
              key={item.Id}
              className={`soft-card p-5 flex flex-col justify-between hover:shadow-soft-md transition-all duration-200 group border ${
                item.Status === 'NEED_CORRECTION'
                  ? 'border-amber-400/50 dark:border-amber-500/30 bg-amber-500/5'
                  : 'border-transparent'
              }`}
            >
              {/* Top Row: Type & Status */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    {item.TypeName || 'Thành tích'}
                  </span>
                  {getStatusBadge(item.Status)}
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 mb-2">
                  {item.Title}
                </h3>

                {/* Description snippet */}
                {item.Description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {item.Description}
                  </p>
                )}

                {/* Banner if NEED_CORRECTION */}
                {item.Status === 'NEED_CORRECTION' && (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Cán bộ quản lý yêu cầu bổ sung thông tin / minh chứng</span>
                  </div>
                )}
              </div>

              {/* Meta information & bottom actions */}
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-soft-darkBorder space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    {item.LecturerId ? (
                      <>
                        <User className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                          {item.LecturerName || 'Cá nhân'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                          {item.UnitName || 'Tập thể đơn vị'}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="shrink-0 font-medium text-slate-400">Năm {item.RecognitionYear}</span>
                </div>

                {/* Evidences indicator & Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{item.EvidencesCount || 0} minh chứng</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Hành động cho DRAFT */}
                    {item.Status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => handleDeleteDraft(item.Id, item.Title)}
                          title="Xóa bản nháp"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenCancel(item)}
                          title="Hủy hồ sơ"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSubmitForApproval(item.Id, item.Title)}
                          title="Nộp xét duyệt"
                          className="px-2.5 py-1 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Nộp</span>
                        </button>
                      </>
                    )}

                    {/* Hành động cho NEED_CORRECTION */}
                    {item.Status === 'NEED_CORRECTION' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Sửa thông tin"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenCancel(item)}
                          title="Hủy hồ sơ"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenResubmit(item)}
                          title="Nộp lại xét duyệt"
                          className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Gửi lại</span>
                        </button>
                      </>
                    )}

                    {/* Hành động cho SUBMITTED */}
                    {item.Status === 'SUBMITTED' && (
                      <button
                        onClick={() => handleOpenCancel(item)}
                        title="Hủy nộp hồ sơ"
                        className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-medium transition-colors"
                      >
                        Hủy nộp
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenDetail(item.Id)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Chi tiết</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL KÊ KHAI THÀNH TÍCH MỚI ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                Kê khai Thành tích & Minh chứng Mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kê khai hồ sơ theo chuẩn quy tắc loại trừ XOR (Cá nhân hoặc Tập thể) và đính kèm minh chứng.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* XOR Owner Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chủ thể Thành tích (XOR Rule) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ownerType: 'PERSONAL' })}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      formData.ownerType === 'PERSONAL'
                        ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-soft-darkBorder text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Cá nhân tôi (Giảng viên)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tự động gán giảng viên hiện tại và đơn vị công tác
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ownerType: 'UNIT' })}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      formData.ownerType === 'UNIT'
                        ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-soft-darkBorder text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Đại diện Tập thể (Khoa/Bộ môn)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Thành tích thuộc về đơn vị, bạn là người đại diện kê khai
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {formData.ownerType === 'UNIT' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chọn Đơn vị Tập thể <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.organizationUnitId}
                    onChange={(e) => setFormData({ ...formData, organizationUnitId: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  >
                    <option value="">-- Chọn Khoa hoặc Bộ môn --</option>
                    {units.map((u) => (
                      <option key={u.Id} value={u.Id}>
                        {u.Code} - {u.Name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Loại thành tích & Năm ghi nhận */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loại Thành tích <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.achievementTypeId}
                    onChange={(e) => setFormData({ ...formData, achievementTypeId: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  >
                    <option value="">-- Chọn loại kết quả --</option>
                    {types.map((t) => (
                      <option key={t.Id} value={t.Id}>
                        [{t.Category}] {t.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Năm Ghi nhận (Dương lịch) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2010"
                    max="2035"
                    value={formData.recognitionYear}
                    onChange={(e) => setFormData({ ...formData, recognitionYear: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Tiêu đề thành tích */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề Thành tích / Tên Bài báo / Tên Đề tài <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Nghiên cứu ứng dụng Deep Learning trong phân loại dữ liệu..."
                  required
                  className="soft-input w-full text-xs"
                />
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả / Đóng góp / Ghi chú bổ sung
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập vai trò tác giả (chính/đồng), thông tin tạp chí, quyết định ban hành..."
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              {/* Upload Minh chứng */}
              <div className="pt-2 border-t border-slate-100 dark:border-soft-darkBorder">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  <span>Đính kèm File Minh chứng Số (Khuyến nghị để nộp duyệt)</span>
                </label>
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-center">
                  <input
                    type="file"
                    id="initial-evidence-file"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="hidden"
                    accept=".pdf,.jpg,.png,.docx"
                  />
                  <label
                    htmlFor="initial-evidence-file"
                    className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-soft-darkCard border border-slate-200 dark:border-soft-darkBorder text-slate-700 dark:text-slate-300 font-medium hover:border-brand-500 transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-brand-500" />
                    <span>Chọn file đính kèm (PDF, DOCX, JPG, PNG)</span>
                  </label>
                  {selectedFile && (
                    <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-soft-darkBorder">
                <button type="button" onClick={() => setShowCreateModal(false)} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="soft-btn-primary text-xs py-2.5 px-5 disabled:opacity-50">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu bản nháp thành tích'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHỈNH SỬA THÀNH TÍCH (DRAFT & NEED_CORRECTION) ================= */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-xl p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-brand-500" />
              <span>Chỉnh sửa Hồ sơ Thành tích</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cập nhật thông tin chi tiết trước khi gửi lại thẩm định.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại thành tích <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editFormData.achievementTypeId}
                  onChange={(e) => setEditFormData({ ...editFormData, achievementTypeId: e.target.value })}
                  required
                  className="soft-input w-full text-xs"
                >
                  {types.map((t) => (
                    <option key={t.Id} value={t.Id}>
                      [{t.Category}] {t.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề thành tích <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                  className="soft-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả / Đóng góp / Giải trình
                </label>
                <textarea
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Năm ghi nhận
                  </label>
                  <input
                    type="number"
                    value={editFormData.recognitionYear}
                    onChange={(e) => setEditFormData({ ...editFormData, recognitionYear: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-soft-darkBorder">
                <button type="button" onClick={() => setShowEditModal(false)} className="soft-btn-secondary text-xs">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="soft-btn-primary text-xs py-2 px-4 disabled:opacity-50">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL NỘP LẠI XÉT DUYỆT (RESUBMIT) ================= */}
      {showResubmitModal && resubmitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setShowResubmitModal(false)} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Gửi lại Hồ sơ Xét duyệt (Resubmit)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Hồ sơ <strong className="text-slate-800 dark:text-slate-200">"{resubmitTarget.Title}"</strong> sẽ được gửi lại Cán bộ quản lý với phiên bản Revision mới kèm snapshot minh chứng số.
            </p>

            <form onSubmit={handleConfirmResubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nội dung ghi chú / Giải trình các nội dung đã bổ sung:
                </label>
                <textarea
                  rows="3"
                  value={resubmitNotes}
                  onChange={(e) => setResubmitNotes(e.target.value)}
                  placeholder="Ví dụ: Đã bổ sung thư chấp nhận bài báo và cập nhật vai trò tác giả chính theo yêu cầu..."
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowResubmitModal(false)} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-semibold disabled:opacity-50">
                  {isSubmitting ? 'Đang nộp lại...' : 'Xác nhận Nộp lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL HỦY HỒ SƠ (CANCEL) ================= */}
      {showCancelModal && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setShowCancelModal(false)} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Xác nhận Hủy Hồ sơ Thành tích
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bạn đang hủy hồ sơ: <strong className="text-slate-800 dark:text-slate-200">"{cancelTarget.Title}"</strong>.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do hủy hồ sơ <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Kê khai nhầm lẫn hoặc muốn rút lại hồ sơ..."
                  required
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCancelModal(false)} className="soft-btn-secondary text-xs">
                  Quay lại
                </button>
                <button type="submit" disabled={isSubmitting} className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-rose-600 to-red-500 text-white font-semibold disabled:opacity-50">
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Hủy hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHI TIẾT THÀNH TÍCH & MINH CHỨNG ================= */}
      {detailAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setDetailAchievement(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {detailAchievement.TypeName}
              </span>
              {getStatusBadge(detailAchievement.Status)}
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">
              {detailAchievement.Title}
            </h2>

            {detailAchievement.Description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl leading-relaxed">
                {detailAchievement.Description}
              </p>
            )}

            {/* Metadata Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs mb-6">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Chủ thể sở hữu</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {detailAchievement.LecturerId
                    ? detailAchievement.LecturerName || 'Cá nhân Giảng viên'
                    : detailAchievement.UnitName || 'Tập thể Đơn vị'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Đơn vị thời điểm</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {detailAchievement.ContextUnitName || 'Khoa CNTT'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Năm ghi nhận</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {detailAchievement.RecognitionYear}
                </span>
              </div>
            </div>

            {/* Evidences & Files List */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  Danh sách Minh chứng Số & Mã băm SHA-256
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {detailAchievement.evidences?.length || 0} tài liệu
                </span>
              </div>

              {(!detailAchievement.evidences || detailAchievement.evidences.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                  Hồ sơ này chưa có file minh chứng nào đính kèm.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {detailAchievement.evidences.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-soft-darkCard border border-slate-100 dark:border-soft-darkBorder shadow-xs space-y-2"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                        <span>{ev.name}</span>
                      </div>

                      {ev.files?.map((f) => (
                        <div
                          key={f.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                        >
                          <div className="truncate">
                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                              <span>{f.originalFileName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                v{f.versionNo}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                              <span>{(f.fileSizeBytes / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span
                                title={`Mã băm SHA256: ${f.fileHash}`}
                                className="font-mono text-slate-400 truncate max-w-[200px]"
                              >
                                SHA256: {f.fileHash?.slice(0, 16)}...
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDownloadFile(f.id, f.originalFileName)}
                            className="soft-btn-primary text-xs py-1.5 px-3 self-start sm:self-auto shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải file</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload thêm file minh chứng nếu là DRAFT hoặc NEED_CORRECTION */}
              {(detailAchievement.Status === 'DRAFT' || detailAchievement.Status === 'NEED_CORRECTION') && (
                <form onSubmit={handleUploadExtraFile} className="p-3.5 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs space-y-3 mt-4">
                  <div className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Đính kèm thêm minh chứng số mới</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Tên minh chứng (tùy chọn)..."
                      value={extraFileName}
                      onChange={(e) => setExtraFileName(e.target.value)}
                      className="soft-input flex-1 text-xs"
                    />
                    <input
                      type="file"
                      id="extra-file-upload"
                      onChange={(e) => setExtraFile(e.target.files[0] || null)}
                      className="hidden"
                      accept=".pdf,.jpg,.png,.docx"
                    />
                    <label
                      htmlFor="extra-file-upload"
                      className="cursor-pointer soft-btn-secondary text-xs py-2 px-3 shrink-0 flex items-center gap-1"
                    >
                      <span>{extraFile ? extraFile.name.slice(0, 15) + '...' : 'Chọn file'}</span>
                    </label>
                    <button
                      type="submit"
                      disabled={!extraFile || isUploadingExtra}
                      className="soft-btn-primary text-xs py-2 px-4 shrink-0 disabled:opacity-50"
                    >
                      {isUploadingExtra ? 'Đang tải...' : 'Upload'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Status History Timeline */}
            <div className="space-y-3 mb-6 pt-4 border-t border-slate-100 dark:border-soft-darkBorder">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-500" />
                Lịch sử Chuyển đổi Trạng thái ({historyList.length} sự kiện)
              </h3>

              {historyList.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs text-center">
                  Hồ sơ đang ở trạng thái khởi tạo bản nháp.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {historyList.map((h) => (
                    <div key={h.Id} className="relative text-xs space-y-1">
                      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full text-white flex items-center justify-center ring-4 ring-white dark:ring-soft-darkCard ${
                        h.ToStatus === 'VERIFIED'
                          ? 'bg-emerald-500'
                          : h.ToStatus === 'NEED_CORRECTION'
                          ? 'bg-amber-500'
                          : h.ToStatus === 'REJECTED'
                          ? 'bg-rose-500'
                          : h.ToStatus === 'REVOKED'
                          ? 'bg-purple-500'
                          : h.ToStatus === 'CANCELLED'
                          ? 'bg-slate-500'
                          : 'bg-brand-500'
                      }`}>
                        {h.ToStatus === 'VERIFIED' ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : h.ToStatus === 'NEED_CORRECTION' ? (
                          <AlertTriangle className="w-2.5 h-2.5" />
                        ) : h.ToStatus === 'REJECTED' ? (
                          <XCircle className="w-2.5 h-2.5" />
                        ) : h.ToStatus === 'REVOKED' ? (
                          <CornerUpLeft className="w-2.5 h-2.5" />
                        ) : (
                          <Send className="w-2.5 h-2.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {h.ToStatus === 'VERIFIED'
                            ? 'Đã xác nhận'
                            : h.ToStatus === 'NEED_CORRECTION'
                            ? 'Yêu cầu bổ sung'
                            : h.ToStatus === 'REJECTED'
                            ? 'Bị từ chối'
                            : h.ToStatus === 'REVOKED'
                            ? 'Đã thu hồi'
                            : h.ToStatus === 'CANCELLED'
                            ? 'Đã hủy'
                            : 'Đã nộp xét duyệt'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.CreatedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>Bởi: <strong>{h.ActorName}</strong> ({h.ActorRole || 'Người dùng'})</span>
                      </div>
                      {h.Reason && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                          "{h.Reason}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-soft-darkBorder flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDetailAchievement(null)}
                className="soft-btn-secondary text-xs"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {detailAchievement.Status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => handleSubmitForApproval(detailAchievement.Id, detailAchievement.Title)}
                    className="soft-btn-primary text-xs py-2 px-4 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Nộp hồ sơ xét duyệt</span>
                  </button>
                )}

                {detailAchievement.Status === 'NEED_CORRECTION' && (
                  <button
                    type="button"
                    onClick={() => {
                      const ach = detailAchievement;
                      setDetailAchievement(null);
                      handleOpenResubmit(ach);
                    }}
                    className="soft-btn-primary text-xs py-2 px-4 bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nộp lại xét duyệt</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
