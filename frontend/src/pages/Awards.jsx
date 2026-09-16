import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Award,
  Plus,
  FileCheck2,
  FileText,
  Building2,
  User,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  ShieldCheck,
  X,
  XCircle,
  CornerUpLeft,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Landmark,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

export default function Awards() {
  const { user } = useAuth();

  // Tab: 'RECORDS' | 'DECISIONS'
  const [activeTab, setActiveTab] = useState('RECORDS');

  // Data states
  const [awards, setAwards] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL'); // 'ALL' | 'PERSONAL' | 'UNIT'
  const [yearFilter, setYearFilter] = useState('');

  // Modals
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [showCreateDecisionModal, setShowCreateDecisionModal] = useState(false);
  const [selectedAward, setSelectedAward] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  // Form states - Create Award Record
  const [recordFormData, setRecordFormData] = useState({
    ownerType: 'PERSONAL',
    lecturerId: '',
    organizationUnitId: '',
    awardTypeId: '',
    decisionId: '',
    recognitionYear: new Date().getFullYear(),
    notes: '',
  });

  // Form states - Create Decision
  const [decisionFormData, setDecisionFormData] = useState({
    decisionNumber: '',
    signDate: new Date().toISOString().split('T')[0],
    signerTitle: 'Hiệu trưởng',
    signerName: 'TS. Lâm Thành Hiển',
    issuingAuthority: 'Trường Đại học Lạc Hồng',
    notes: '',
  });
  const [decisionFile, setDecisionFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsRes, decisionsRes, typesRes, unitsRes, lecturersRes] = await Promise.all([
        api.get('/award-records').catch(() => ({ data: [] })),
        api.get('/awards/decisions').catch(() => ({ data: [] })),
        api.get('/awards/types').catch(() => ({ data: [] })),
        api.get('/units').catch(() => ({ data: [] })),
        api.get('/lecturers').catch(() => ({ data: [] })),
      ]);

      setAwards(recordsRes.data || []);
      setDecisions(decisionsRes.data || []);
      setTypes(typesRes.data || []);
      setUnits(unitsRes.data || []);
      setLecturers(lecturersRes.data || []);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu khen thưởng:', err);
      const errMsg = err.response?.data?.error?.message || err.message || 'Không thể nạp dữ liệu khen thưởng';
      setError(errMsg);
      setFeedback({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    if (!decisionFormData.decisionNumber.trim()) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập số quyết định' });
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('decisionNumber', decisionFormData.decisionNumber.trim());
      form.append('signDate', decisionFormData.signDate);
      form.append('signerTitle', decisionFormData.signerTitle);
      form.append('signerName', decisionFormData.signerName);
      form.append('issuingAuthority', decisionFormData.issuingAuthority);
      form.append('notes', decisionFormData.notes);
      if (decisionFile) {
        form.append('file', decisionFile);
      }

      const token = localStorage.getItem('accessToken');
      const res = await axios.post('/api/v1/awards/decisions', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setFeedback({
        type: 'success',
        text: `Đã ban hành thành công quyết định số "${decisionFormData.decisionNumber}"!`,
      });

      setShowCreateDecisionModal(false);
      setDecisionFile(null);
      setDecisionFormData({
        decisionNumber: '',
        signDate: new Date().toISOString().split('T')[0],
        signerTitle: 'Hiệu trưởng',
        signerName: 'TS. Lâm Thành Hiển',
        issuingAuthority: 'Trường Đại học Lạc Hồng',
        notes: '',
      });
      loadAllData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi tạo quyết định',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!recordFormData.awardTypeId) {
      setFeedback({ type: 'error', text: 'Vui lòng chọn loại danh hiệu khen thưởng' });
      return;
    }
    if (!recordFormData.decisionId) {
      setFeedback({ type: 'error', text: 'Vui lòng chọn văn bản quyết định' });
      return;
    }
    if (recordFormData.ownerType === 'PERSONAL' && !recordFormData.lecturerId) {
      setFeedback({ type: 'error', text: 'Vui lòng chọn giảng viên được khen thưởng' });
      return;
    }
    if (recordFormData.ownerType === 'UNIT' && !recordFormData.organizationUnitId) {
      setFeedback({ type: 'error', text: 'Vui lòng chọn đơn vị tập thể được khen thưởng' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        awardTypeId: parseInt(recordFormData.awardTypeId, 10),
        decisionId: parseInt(recordFormData.decisionId, 10),
        recognitionYear: parseInt(recordFormData.recognitionYear, 10),
        status: 'RECORDED', // Chính thức ghi nhận
        notes: recordFormData.notes,
        lecturerId: recordFormData.ownerType === 'PERSONAL' ? parseInt(recordFormData.lecturerId, 10) : null,
        organizationUnitId: recordFormData.ownerType === 'UNIT' ? parseInt(recordFormData.organizationUnitId, 10) : null,
      };

      await api.post('/award-records', payload);

      setFeedback({
        type: 'success',
        text: 'Đã ghi nhận thành công kết quả khen thưởng vào sổ lưu trữ!',
      });

      setShowCreateRecordModal(false);
      setRecordFormData({
        ownerType: 'PERSONAL',
        lecturerId: '',
        organizationUnitId: '',
        awardTypeId: '',
        decisionId: '',
        recognitionYear: new Date().getFullYear(),
        notes: '',
      });
      loadAllData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi ghi nhận khen thưởng',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = async (award) => {
    try {
      const [res, histRes] = await Promise.all([
        api.get(`/award-records/${award.Id}`),
        api.get(`/award-records/${award.Id}/history`).catch(() => ({ data: [] })),
      ]);
      setSelectedAward(res.data);
      setHistoryList(histRes.data || []);
    } catch (err) {
      console.error(err);
      setSelectedAward(award);
      setHistoryList([]);
    }
  };

  const handleOpenRevoke = (award) => {
    setSelectedAward(award);
    setRevokeReason('');
    setShowRevokeModal(true);
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!selectedAward || !revokeReason.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/award-records/${selectedAward.Id}/revoke`, {
        reason: revokeReason.trim(),
        rowVersion: selectedAward.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: 'Đã thu hồi thành công danh hiệu khen thưởng!',
      });
      setShowRevokeModal(false);
      setSelectedAward(null);
      loadAllData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi thu hồi khen thưởng',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered awards
  const filteredAwards = awards.filter((a) => {
    const matchSearch =
      !search ||
      a.AwardTypeName?.toLowerCase().includes(search.toLowerCase()) ||
      a.DecisionNumber?.toLowerCase().includes(search.toLowerCase()) ||
      a.LecturerName?.toLowerCase().includes(search.toLowerCase()) ||
      a.UnitName?.toLowerCase().includes(search.toLowerCase()) ||
      a.Notes?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || a.Status === statusFilter;
    const matchOwner =
      ownerFilter === 'ALL' ||
      (ownerFilter === 'PERSONAL' && a.LecturerId) ||
      (ownerFilter === 'UNIT' && a.OrganizationUnitId);
    const matchYear = !yearFilter || a.RecognitionYear.toString() === yearFilter;

    return matchSearch && matchStatus && matchOwner && matchYear;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECORDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Đã ghi nhận (RECORDED)
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/20">
            <CornerUpLeft className="w-3 h-3" />
            Đã thu hồi (REVOKED)
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

  const getLevelBadge = (level) => {
    switch (level) {
      case 'STATE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Cấp Nhà nước
          </span>
        );
      case 'MINISTRY':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Cấp Bộ / Tỉnh
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            Cấp Trường
          </span>
        );
    }
  };

  // Metrics
  const personalAwardsCount = awards.filter((a) => a.LecturerId && a.Status === 'RECORDED').length;
  const unitAwardsCount = awards.filter((a) => a.OrganizationUnitId && a.Status === 'RECORDED').length;
  const highLevelAwardsCount = awards.filter((a) => (a.AwardLevel === 'MINISTRY' || a.AwardLevel === 'STATE') && a.Status === 'RECORDED').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            Sổ Khen thưởng & Quyết định Ban hành
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ghi nhận chính thức các danh hiệu thi đua và hình thức khen thưởng theo văn bản quyết định có chữ ký và số ban hành.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateDecisionModal(true)}
            className="soft-btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Quyết định</span>
          </button>

          <button
            onClick={() => setShowCreateRecordModal(true)}
            className="soft-btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-soft-sm bg-gradient-to-r from-amber-600 to-orange-500 text-white font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ghi nhận Khen thưởng</span>
          </button>
        </div>
      </div>

      {/* Blueprint Domain Separation Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Nguyên tắc Tách bạch Nghiệp vụ (Blueprint Mục 2 & Mục 6):</div>
          <div className="text-[11px] text-amber-800/90 dark:text-amber-300 leading-relaxed">
            • <strong>Thành tích vs Khen thưởng:</strong> Xác nhận thành tích (`Achievements`) không đồng nghĩa đã được trao danh hiệu. Khen thưởng (`AwardRecords`) chỉ phát sinh khi đã có <strong>Quyết định ban hành</strong> chính thức từ cơ quan thẩm quyền.<br />
            • <strong>Ràng buộc Rule 9:</strong> Chặn trùng lặp cùng 1 chủ thể + 1 loại danh hiệu + 1 quyết định ở trạng thái RECORDED.<br />
            • <strong>Quyền hạn:</strong> Chỉ Cán bộ hồ sơ (`RecordsOfficer`) và Quản trị viên (`Admin`) được phép ghi nhận và thu hồi danh hiệu.
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="soft-card p-4 space-y-1.5 border-l-4 border-amber-500">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Quyết định Ban hành</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{decisions.length}</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="soft-card p-4 space-y-1.5 border-l-4 border-brand-500">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Danh hiệu Cá nhân</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{personalAwardsCount}</span>
            <User className="w-4 h-4 text-brand-500" />
          </div>
        </div>

        <div className="soft-card p-4 space-y-1.5 border-l-4 border-emerald-500">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Khen thưởng Tập thể</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{unitAwardsCount}</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="soft-card p-4 space-y-1.5 border-l-4 border-red-500">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cấp Bộ & Nhà nước</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{highLevelAwardsCount}</span>
            <Landmark className="w-4 h-4 text-red-500" />
          </div>
        </div>
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

      {/* Navigation Tabs Switcher & Search Bar */}
      <div className="soft-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'RECORDS'
                ? 'bg-white dark:bg-soft-darkCard text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Sổ Khen thưởng</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              {awards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('DECISIONS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'DECISIONS'
                ? 'bg-white dark:bg-soft-darkCard text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quyết định Ban hành</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold">
              {decisions.length}
            </span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo số quyết định, danh hiệu, cá nhân, đơn vị..."
              className="soft-input w-full pl-10 text-xs"
            />
          </div>

          {activeTab === 'RECORDS' && (
            <>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="soft-input py-1.5 px-2.5 text-xs w-auto"
              >
                <option value="ALL">Tất cả chủ thể</option>
                <option value="PERSONAL">Cá nhân</option>
                <option value="UNIT">Tập thể</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="soft-input py-1.5 px-2.5 text-xs w-auto"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="RECORDED">Đã ghi nhận (RECORDED)</option>
                <option value="REVOKED">Đã thu hồi (REVOKED)</option>
                <option value="DRAFT">Bản nháp (DRAFT)</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <ErrorState message={error} onRetry={loadAllData} />
      ) : loading ? (
        <LoadingSkeleton type={activeTab === 'RECORDS' ? 'card' : 'table'} count={6} rows={6} />
      ) : activeTab === 'RECORDS' ? (
        filteredAwards.length === 0 ? (
          <EmptyState
            icon={Award}
            title={search || statusFilter || ownerFilter !== 'ALL' || yearFilter ? 'Không tìm thấy bản ghi khen thưởng phù hợp' : 'Chưa có bản ghi khen thưởng nào'}
            description={
              search || statusFilter || ownerFilter !== 'ALL' || yearFilter
                ? 'Không tìm thấy danh hiệu khen thưởng nào khớp với các tiêu chí tìm kiếm và bộ lọc đang chọn.'
                : 'Bắt đầu ghi nhận danh hiệu thi đua chính thức cho giảng viên hoặc tập thể đơn vị.'
            }
            actionLabel={search || statusFilter || ownerFilter !== 'ALL' || yearFilter ? 'Xóa bộ lọc' : 'Ghi nhận ngay'}
            actionIcon={search || statusFilter || ownerFilter !== 'ALL' || yearFilter ? RotateCcw : Sparkles}
            onAction={
              search || statusFilter || ownerFilter !== 'ALL' || yearFilter
                ? () => { setSearch(''); setStatusFilter(''); setOwnerFilter('ALL'); setYearFilter(''); }
                : () => setShowCreateRecordModal(true)
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAwards.map((item) => (
              <div
                key={item.Id}
                className="soft-card p-5 flex flex-col justify-between hover:shadow-soft-md transition-all duration-200 border border-transparent hover:border-amber-500/20"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    {getLevelBadge(item.AwardLevel)}
                    {getStatusBadge(item.Status)}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {item.AwardTypeName}
                  </h3>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-soft-darkBorder text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>QĐ: {item.DecisionNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span>Ngày ký: {new Date(item.SignDate).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span>Cơ quan: {item.IssuingAuthority}</span>
                    </div>
                  </div>

                  {item.Notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                      "{item.Notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-soft-darkBorder space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      {item.LecturerId ? (
                        <>
                          <User className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                            {item.LecturerName}
                          </span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                            {item.UnitName}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="shrink-0 font-medium">Năm {item.RecognitionYear}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="soft-btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Chi tiết</span>
                    </button>

                    {item.Status === 'RECORDED' && (
                      <button
                        onClick={() => handleOpenRevoke(item)}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <CornerUpLeft className="w-3 h-3" />
                        <span>Thu hồi</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TAB DECISIONS */
        decisions.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="Chưa có quyết định ban hành nào"
            description="Ban hành các văn bản quyết định khen thưởng chính thức từ Ban Giám hiệu để liên kết với danh sách người được khen thưởng."
            actionLabel="Ban hành quyết định"
            actionIcon={Plus}
            onAction={() => setShowCreateDecisionModal(true)}
          />
        ) : (
          <div className="space-y-3.5">
            {decisions.map((dec) => (
            <div
              key={dec.Id}
              className="soft-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-soft-md transition-all duration-200"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    Số: {dec.DecisionNumber}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Ngày ký: {new Date(dec.SignDate).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    • {dec.RecordedAwardsCount || 0} cá nhân/tập thể được khen thưởng
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {dec.IssuingAuthority} — Người ký: {dec.SignerTitle ? `${dec.SignerTitle} ` : ''}{dec.SignerName || 'Đã ký'}
                </h3>

                {dec.Notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {dec.Notes}
                  </p>
                )}

                {dec.OriginalFileName && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{dec.OriginalFileName} ({(dec.FileSizeBytes / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  onClick={() => {
                    setRecordFormData({
                      ...recordFormData,
                      decisionId: dec.Id.toString(),
                    });
                    setShowCreateRecordModal(true);
                  }}
                  className="soft-btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ghi nhận người nhận</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* ================= MODAL GHI NHẬN KHEN THƯỞNG MỚI ================= */}
      {showCreateRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowCreateRecordModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                Ghi nhận Kết quả Khen thưởng Mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gắn danh hiệu thi đua chính thức cho Giảng viên hoặc Đơn vị theo văn bản quyết định.
              </p>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3.5 text-xs">
              {/* Chọn Quyết định */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Văn bản Quyết định Khen thưởng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={recordFormData.decisionId}
                  onChange={(e) => setRecordFormData({ ...recordFormData, decisionId: e.target.value })}
                  required
                  className="soft-input w-full text-xs"
                >
                  <option value="">-- Chọn văn bản quyết định đã ban hành --</option>
                  {decisions.map((d) => (
                    <option key={d.Id} value={d.Id}>
                      Số {d.DecisionNumber} ({new Date(d.SignDate).toLocaleDateString('vi-VN')}) - {d.IssuingAuthority}
                    </option>
                  ))}
                </select>
              </div>

              {/* XOR Chủ thể */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chủ thể được Khen thưởng (XOR Rule) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRecordFormData({ ...recordFormData, ownerType: 'PERSONAL' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      recordFormData.ownerType === 'PERSONAL'
                        ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'border-slate-200 dark:border-soft-darkBorder text-slate-500'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Cá nhân Giảng viên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordFormData({ ...recordFormData, ownerType: 'UNIT' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      recordFormData.ownerType === 'UNIT'
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'border-slate-200 dark:border-soft-darkBorder text-slate-500'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Tập thể Đơn vị (Khoa/Bộ môn)</span>
                  </button>
                </div>
              </div>

              {recordFormData.ownerType === 'PERSONAL' ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chọn Giảng viên <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={recordFormData.lecturerId}
                    onChange={(e) => setRecordFormData({ ...recordFormData, lecturerId: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  >
                    <option value="">-- Chọn Giảng viên được trao thưởng --</option>
                    {lecturers.map((l) => (
                      <option key={l.Id} value={l.Id}>
                        {l.StaffCode} - {l.FullName} ({l.Position || 'Giảng viên'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chọn Tập thể Đơn vị <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={recordFormData.organizationUnitId}
                    onChange={(e) => setRecordFormData({ ...recordFormData, organizationUnitId: e.target.value })}
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

              {/* Loại danh hiệu & Năm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Danh hiệu / Hình thức Khen thưởng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={recordFormData.awardTypeId}
                    onChange={(e) => setRecordFormData({ ...recordFormData, awardTypeId: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  >
                    <option value="">-- Chọn danh hiệu --</option>
                    {types.map((t) => (
                      <option key={t.Id} value={t.Id}>
                        [{t.AwardLevel}] {t.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Năm Ghi nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={recordFormData.recognitionYear}
                    onChange={(e) => setRecordFormData({ ...recordFormData, recognitionYear: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trích yếu thành tích / Ghi chú
                </label>
                <textarea
                  rows="2"
                  value={recordFormData.notes}
                  onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                  placeholder="Ví dụ: Đạt danh hiệu Chiến sĩ thi đua cơ sở nhờ đề tài NCKH xuất sắc..."
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-soft-darkBorder">
                <button type="button" onClick={() => setShowCreateRecordModal(false)} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="soft-btn-primary text-xs py-2 px-4 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-semibold disabled:opacity-50">
                  {isSubmitting ? 'Đang ghi nhận...' : 'Chính thức Ghi nhận (RECORDED)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL BAN HÀNH QUYẾT ĐỊNH MỚI ================= */}
      {showCreateDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowCreateDecisionModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                Ban hành Văn bản Quyết định Khen thưởng
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lưu trữ văn bản quyết định chính thức và đính kèm file số hóa (SHA-256).
              </p>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Quyết định <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 125/QĐ-ĐHLH"
                    value={decisionFormData.decisionNumber}
                    onChange={(e) => setDecisionFormData({ ...decisionFormData, decisionNumber: e.target.value })}
                    required
                    className="soft-input w-full text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày Ký <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={decisionFormData.signDate}
                    onChange={(e) => setDecisionFormData({ ...decisionFormData, signDate: e.target.value })}
                    required
                    className="soft-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cơ quan Ban hành <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={decisionFormData.issuingAuthority}
                  onChange={(e) => setDecisionFormData({ ...decisionFormData, issuingAuthority: e.target.value })}
                  required
                  className="soft-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chức danh Người ký
                  </label>
                  <input
                    type="text"
                    value={decisionFormData.signerTitle}
                    onChange={(e) => setDecisionFormData({ ...decisionFormData, signerTitle: e.target.value })}
                    className="soft-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ tên Người ký
                  </label>
                  <input
                    type="text"
                    value={decisionFormData.signerName}
                    onChange={(e) => setDecisionFormData({ ...decisionFormData, signerName: e.target.value })}
                    className="soft-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung tóm tắt / Ghi chú quyết định
                </label>
                <textarea
                  rows="2"
                  value={decisionFormData.notes}
                  onChange={(e) => setDecisionFormData({ ...decisionFormData, notes: e.target.value })}
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              {/* Upload file */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Văn bản Số hóa (PDF, DOCX, JPG, PNG)
                </label>
                <input
                  type="file"
                  onChange={(e) => setDecisionFile(e.target.files[0] || null)}
                  className="soft-input w-full text-xs p-1.5"
                  accept=".pdf,.docx,.jpg,.png"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-soft-darkBorder">
                <button type="button" onClick={() => setShowCreateDecisionModal(false)} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="soft-btn-primary text-xs py-2 px-4 disabled:opacity-50">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Quyết định'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHI TIẾT KHEN THƯỞNG ================= */}
      {selectedAward && !showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedAward(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              {getLevelBadge(selectedAward.AwardLevel)}
              {getStatusBadge(selectedAward.Status)}
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
              {selectedAward.AwardTypeName}
            </h2>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Chủ thể:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedAward.LecturerName || selectedAward.UnitName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Đơn vị:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAward.ContextUnitName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Văn bản Quyết định:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {selectedAward.DecisionNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Ngày ký & Cơ quan:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {new Date(selectedAward.SignDate).toLocaleDateString('vi-VN')} — {selectedAward.IssuingAuthority}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Năm khen thưởng:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAward.RecognitionYear}</span>
              </div>
            </div>

            {selectedAward.Notes && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Trích yếu / Ghi chú:</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl leading-relaxed italic">
                  "{selectedAward.Notes}"
                </p>
              </div>
            )}

            {/* Status History Timeline */}
            <div className="pt-3 border-t border-slate-100 dark:border-soft-darkBorder space-y-3 mb-6">
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Lịch sử Ghi nhận & Thay đổi ({historyList.length} sự kiện)
              </div>
              {historyList.map((h) => (
                <div key={h.Id} className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{h.ToStatus === 'RECORDED' ? 'Ghi nhận chính thức' : h.ToStatus === 'REVOKED' ? 'Thu hồi danh hiệu' : h.ToStatus}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{new Date(h.CreatedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Bởi: {h.ActorName} ({h.ActorRole})</div>
                  {h.Reason && <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{h.Reason}"</div>}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-soft-darkBorder">
              <button onClick={() => setSelectedAward(null)} className="soft-btn-secondary text-xs">
                Đóng
              </button>

              {selectedAward.Status === 'RECORDED' && (
                <button
                  onClick={() => handleOpenRevoke(selectedAward)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Thu hồi danh hiệu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL THU HỒI KHEN THƯỞNG (REVOKE) ================= */}
      {showRevokeModal && selectedAward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setShowRevokeModal(false)} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <CornerUpLeft className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Thu hồi Quyết định Khen thưởng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bạn đang thực hiện thu hồi danh hiệu: <br />
              <strong className="text-slate-800 dark:text-slate-200">"{selectedAward.AwardTypeName}"</strong> trao cho <strong className="text-slate-800 dark:text-slate-200">{selectedAward.LecturerName || selectedAward.UnitName}</strong>.
            </p>

            <form onSubmit={handleConfirmRevoke} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do thu hồi / Số quyết định đính chính <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows="3"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Ví dụ: Thu hồi theo Quyết định số 45/QĐ-ĐHLH ngày 10/10/2024 do phát hiện kê khai trùng lặp..."
                  required
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRevokeModal(false)} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang thu hồi...' : 'Xác nhận Thu hồi (REVOKED)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
