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
} from 'lucide-react';

export default function Achievements() {
  const { user } = useAuth();

  // Data states
  const [achievements, setAchievements] = useState([]);
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Form states
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
      setFeedback({ type: 'error', text: err.message || 'Không thể tải danh sách thành tích.' });
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

      // Reset form & reload
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
            <Clock className="w-3 h-3" />
            Chờ xét duyệt
          </span>
        );
      case 'NEED_CORRECTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            Cần bổ sung
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
            Kê khai bài báo quốc tế (Q1/Q2), đề tài NCKH, sáng chế, giải thưởng và minh chứng số an toàn.
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
                  ? 'bg-white dark:bg-soft-darkCard text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Cá nhân
            </button>
            <button
              onClick={() => setOwnerFilter('UNIT')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                ownerFilter === 'UNIT'
                  ? 'bg-white dark:bg-soft-darkCard text-slate-800 dark:text-white shadow-xs'
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
            className="soft-input text-xs py-2 px-3 pr-8 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="SUBMITTED">Chờ duyệt</option>
            <option value="NEED_CORRECTION">Cần bổ sung</option>
            <option value="VERIFIED">Đã xác nhận</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="soft-card p-12 text-center text-slate-400 text-xs animate-pulse">
          Đang tải danh sách thành tích số từ hệ thống...
        </div>
      ) : filteredAchievements.length === 0 ? (
        /* Empty State */
        <div className="soft-card p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4 shadow-sm">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {search || statusFilter ? 'Không tìm thấy thành tích phù hợp' : 'Chưa có hồ sơ thành tích nào'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            {search || statusFilter
              ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.'
              : 'Hãy bắt đầu bằng cách kê khai thành tích mới và tải lên tài liệu minh chứng số.'}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="soft-btn-primary text-xs mx-auto">
            <Plus className="w-4 h-4" />
            <span>Kê khai ngay</span>
          </button>
        </div>
      ) : (
        /* Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((item) => (
            <div
              key={item.Id}
              className="soft-card p-5 flex flex-col justify-between hover:shadow-soft-md transition-all duration-200 group border border-transparent hover:border-brand-500/20"
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
                    <span>
                      {item.EvidencesCount || 0} minh chứng
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                          onClick={() => handleSubmitForApproval(item.Id, item.Title)}
                          title="Nộp xét duyệt"
                          className="px-2.5 py-1 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Nộp duyệt</span>
                        </button>
                      </>
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
            {/* Close button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                Kê khai Thành tích & Minh chứng Mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Áp dụng quy tắc chủ thể loại trừ (XOR) và đính kèm minh chứng số lưu trữ bất biến.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* 1. Chọn Chủ thể (XOR Rule) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  1. Chủ thể sở hữu thành tích <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`cursor-pointer rounded-2xl p-3 border text-xs flex items-center gap-3 transition-all ${
                      formData.ownerType === 'PERSONAL'
                        ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400 shadow-xs ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-soft-darkBorder text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ownerType"
                      value="PERSONAL"
                      checked={formData.ownerType === 'PERSONAL'}
                      onChange={() => setFormData({ ...formData, ownerType: 'PERSONAL', organizationUnitId: '' })}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-brand-500" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">Cá nhân tôi</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Giảng viên ({user?.fullName || 'Hiện tại'})</div>
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer rounded-2xl p-3 border text-xs flex items-center gap-3 transition-all ${
                      formData.ownerType === 'UNIT'
                        ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-soft-darkBorder text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ownerType"
                      value="UNIT"
                      checked={formData.ownerType === 'UNIT'}
                      onChange={() => setFormData({ ...formData, ownerType: 'UNIT' })}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">Đại diện tập thể</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Khoa hoặc Bộ môn chuyên môn</div>
                    </div>
                  </label>
                </div>

                {/* Nếu chọn tập thể, hiển thị dropdown chọn đơn vị */}
                {formData.ownerType === 'UNIT' && (
                  <div className="mt-3 animate-fadeIn">
                    <select
                      value={formData.organizationUnitId}
                      onChange={(e) => setFormData({ ...formData, organizationUnitId: e.target.value })}
                      required
                      className="soft-input w-full text-xs"
                    >
                      <option value="">-- Chọn đơn vị tập thể lập thành tích --</option>
                      {units.map((u) => (
                        <option key={u.Id} value={u.Id}>
                          {u.Name} ({u.Type === 'FACULTY' ? 'Khoa' : 'Bộ môn'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. Loại thành tích & Năm ghi nhận */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    2. Loại thành tích <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.achievementTypeId}
                    onChange={(e) => setFormData({ ...formData, achievementTypeId: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  >
                    <option value="">-- Chọn loại danh mục thành tích --</option>
                    {types.map((t) => (
                      <option key={t.Id} value={t.Id}>
                        [{t.Code}] {t.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Năm ghi nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.recognitionYear}
                    onChange={(e) => setFormData({ ...formData, recognitionYear: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  />
                </div>
              </div>

              {/* 3. Tiêu đề */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  3. Tiêu đề thành tích <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Nghiên cứu ứng dụng Deep Learning trong nhận dạng ảnh y tế..."
                  required
                  className="soft-input w-full text-xs"
                />
              </div>

              {/* 4. Mô tả */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  4. Mô tả chi tiết hoặc nguồn công bố
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi rõ tên tạp chí, chỉ số IF, số quyết định phê duyệt đề tài hoặc đơn vị trao thưởng..."
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              {/* 5. Đính kèm File Minh chứng */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  5. Tệp tài liệu minh chứng số (PDF, DOCX, PNG, JPG ≤ 10MB)
                </label>

                <div className="relative border-2 border-dashed border-slate-200 dark:border-soft-darkBorder rounded-2xl p-4 text-center hover:border-brand-500/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!formData.evidenceName) {
                          setFormData({ ...formData, evidenceName: e.target.files[0].name });
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between bg-brand-50/60 dark:bg-brand-500/10 p-2.5 rounded-xl text-left">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-5 h-5 text-brand-500 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {selectedFile.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-slate-400">
                      <Upload className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Nhấn hoặc kéo thả tài liệu vào đây
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Tự động tính mã băm SHA-256 bảo đảm tính bất biến
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-soft-darkBorder">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="soft-btn-secondary text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="soft-btn-primary text-xs py-2.5 px-5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Đang lưu bản nháp...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lưu bản nháp thành tích</span>
                    </>
                  )}
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
            {/* Close button */}
            <button
              onClick={() => setDetailAchievement(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
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
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                          <span>{ev.name}</span>
                        </div>
                      </div>

                      {/* File version items */}
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
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-soft-darkCard">
                        {h.ToStatus === 'VERIFIED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Send className="w-2.5 h-2.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {h.ToStatus === 'VERIFIED' ? 'Đã xác nhận' : 'Đã nộp xét duyệt'}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
