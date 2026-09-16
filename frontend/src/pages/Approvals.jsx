import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  CheckSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileCheck,
  User,
  Building2,
  Download,
  Eye,
  ShieldCheck,
  X,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  RotateCcw,
  XCircle,
  History,
  CornerUpLeft,
} from 'lucide-react';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

export default function Approvals() {
  const { user } = useAuth();

  // Tab state: 'PENDING' | 'VERIFIED'
  const [activeTab, setActiveTab] = useState('PENDING');

  const [pendingList, setPendingList] = useState([]);
  const [verifiedList, setVerifiedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState('');

  // Selected item for review & actions
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);

  // Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyReason, setVerifyReason] = useState('Hồ sơ và minh chứng số hợp lệ, đã thẩm định đạt yêu cầu.');

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, verifiedRes] = await Promise.all([
        api.get('/approvals/pending').catch(() => ({ data: [] })),
        api.get('/approvals/verified').catch(() => ({ data: [] })),
      ]);
      setPendingList(pendingRes.data || []);
      setVerifiedList(verifiedRes.data || []);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu xét duyệt:', err);
      const errMsg = err.response?.data?.error?.message || err.message || 'Không thể tải danh sách xét duyệt';
      setError(errMsg);
      setFeedback({
        type: 'error',
        text: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (item) => {
    setSelectedItem(item);
    try {
      const res = await api.get(`/achievements/${item.Id}`);
      setDetailData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const closeAllModals = () => {
    setVerifyModalOpen(false);
    setCorrectionModalOpen(false);
    setRejectModalOpen(false);
    setRevokeModalOpen(false);
    setSelectedItem(null);
    setDetailData(null);
  };

  // 1. Phê duyệt (VERIFIED)
  const handleOpenVerifyModal = (item) => {
    setSelectedItem(item);
    setVerifyReason('Hồ sơ và minh chứng số hợp lệ, đã thẩm định đạt yêu cầu.');
    setVerifyModalOpen(true);
  };

  const handleConfirmVerify = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsProcessing(true);
    setFeedback(null);
    try {
      await api.post(`/approvals/${selectedItem.Id}/verify`, {
        reason: verifyReason.trim() || 'Xác nhận thành tích hợp lệ',
        rowVersion: selectedItem.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: `Đã phê duyệt thành công hồ sơ "${selectedItem.Title}" (Trạng thái: VERIFIED)!`,
      });
      closeAllModals();
      loadAllData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi phê duyệt hồ sơ',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Yêu cầu bổ sung (NEED_CORRECTION)
  const handleOpenCorrectionModal = (item) => {
    setSelectedItem(item);
    setCorrectionReason('');
    setCorrectionModalOpen(true);
  };

  const handleConfirmCorrection = async (e) => {
    e.preventDefault();
    if (!selectedItem || !correctionReason.trim()) return;

    setIsProcessing(true);
    setFeedback(null);
    try {
      await api.post(`/approvals/${selectedItem.Id}/request-correction`, {
        reason: correctionReason.trim(),
        rowVersion: selectedItem.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: `Đã gửi yêu cầu bổ sung hồ sơ "${selectedItem.Title}" thành công!`,
      });
      closeAllModals();
      loadAllData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi yêu cầu bổ sung',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Từ chối (REJECTED)
  const handleOpenRejectModal = (item) => {
    setSelectedItem(item);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedItem || !rejectReason.trim()) return;

    setIsProcessing(true);
    setFeedback(null);
    try {
      await api.post(`/approvals/${selectedItem.Id}/reject`, {
        reason: rejectReason.trim(),
        rowVersion: selectedItem.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: `Đã từ chối công nhận hồ sơ "${selectedItem.Title}"!`,
      });
      closeAllModals();
      loadAllData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi từ chối hồ sơ',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Thu hồi (REVOKED)
  const handleOpenRevokeModal = (item) => {
    setSelectedItem(item);
    setRevokeReason('');
    setRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!selectedItem || !revokeReason.trim()) return;

    setIsProcessing(true);
    setFeedback(null);
    try {
      await api.post(`/approvals/${selectedItem.Id}/revoke`, {
        reason: revokeReason.trim(),
        rowVersion: selectedItem.RowVersion,
      });

      setFeedback({
        type: 'success',
        text: `Đã thu hồi thành công hồ sơ "${selectedItem.Title}" (Trạng thái: REVOKED)!`,
      });
      closeAllModals();
      loadAllData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi thu hồi hồ sơ',
      });
    } finally {
      setIsProcessing(false);
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

  const currentList = activeTab === 'PENDING' ? pendingList : verifiedList;
  const filteredItems = currentList.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.Title?.toLowerCase().includes(q) ||
      item.LecturerName?.toLowerCase().includes(q) ||
      item.UnitName?.toLowerCase().includes(q) ||
      item.TypeName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            Xét duyệt Hồ sơ Thành tích & Minh chứng
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thẩm định minh chứng số, phê duyệt, yêu cầu bổ sung, từ chối hoặc thu hồi trong phạm vi đơn vị phân công.
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="soft-btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Blueprint Compliance Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Quy tắc Nghiệp vụ Phê duyệt & Khóa bất biến (Blueprint Mục 5 & 6):</div>
          <div className="text-[11px] text-amber-800/90 dark:text-amber-300 leading-relaxed">
            • <strong>Phạm vi quản lý:</strong>{' '}
            <span className="font-semibold underline">
              {user?.unitScopes?.[0]?.UnitName || 'Khoa Công nghệ Thông tin'} (kèm các Bộ môn con trực thuộc)
            </span>
            .<br />
            • <strong>Chống tự duyệt:</strong> Hồ sơ do chính bạn kê khai tự động bị ẩn khỏi hàng chờ và chặn phê duyệt.<br />
            • <strong>Bất biến dữ liệu:</strong> Hồ sơ VERIFIED được khóa an toàn. Mọi hiệu đính/thu hồi phải có lý do giải trình lưu vào lịch sử.
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

      {/* Tabs Switcher & Search Bar */}
      <div className="soft-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'PENDING'
                ? 'bg-white dark:bg-soft-darkCard text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ xét duyệt</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFIED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'VERIFIED'
                ? 'bg-white dark:bg-soft-darkCard text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã xác nhận (VERIFIED)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {verifiedList.length}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, tác giả, bộ môn..."
            className="soft-input w-full pl-10 text-xs"
          />
        </div>
      </div>

      {/* Items List */}
      {error ? (
        <ErrorState message={error} onRetry={loadAllData} />
      ) : loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={search ? 'Không tìm thấy hồ sơ phù hợp' : activeTab === 'PENDING' ? 'Hàng chờ xét duyệt hiện đang trống' : 'Chưa có hồ sơ nào được xác nhận'}
          description={
            search
              ? 'Không tìm thấy hồ sơ nào khớp với từ khóa tìm kiếm. Thử tìm kiếm với từ khóa khác.'
              : activeTab === 'PENDING'
              ? 'Tất cả các hồ sơ thành tích trong phạm vi đơn vị phụ trách đã được xử lý xong!'
              : 'Các hồ sơ sau khi được phê duyệt sẽ hiển thị tại danh sách này để quản lý và theo dõi.'
          }
          actionLabel={search ? 'Xóa tìm kiếm' : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.Id}
              className={`soft-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-soft-md transition-all duration-200 border border-transparent ${
                activeTab === 'PENDING' ? 'hover:border-amber-500/20' : 'hover:border-emerald-500/20'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    {item.TypeName}
                  </span>

                  {activeTab === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
                      <Clock className="w-3 h-3" />
                      Chờ duyệt (Lần {item.RevisionNo || 1})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Đã xác nhận (VERIFIED)
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 font-medium">
                    Năm ghi nhận: <strong>{item.RecognitionYear}</strong>
                  </span>

                  {item.VerifiedAt && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      • Duyệt ngày: {new Date(item.VerifiedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {item.Title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    {item.LecturerName ? (
                      <>
                        <User className="w-3.5 h-3.5 text-brand-500" />
                        <span>Tác giả: {item.LecturerName}</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đơn vị: {item.UnitName}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-medium">
                    <span className="text-slate-400">•</span>
                    <span>Bộ môn/Khoa: {item.ContextUnitName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold">
                    <span className="text-slate-400">•</span>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{item.EvidencesCount || 0} minh chứng số</span>
                  </div>
                </div>

                {item.VerifiedReason && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    Ý kiến duyệt: "{item.VerifiedReason}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  onClick={() => handleOpenReview(item)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem hồ sơ</span>
                </button>

                {activeTab === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleOpenCorrectionModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Yêu cầu bổ sung</span>
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>

                    <button
                      onClick={() => handleOpenVerifyModal(item)}
                      className="soft-btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-soft-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê duyệt</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenRevokeModal(item)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    <span>Thu hồi xác nhận</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL XEM CHI TIẾT & MINH CHỨNG ================= */}
      {selectedItem && !verifyModalOpen && !correctionModalOpen && !rejectModalOpen && !revokeModalOpen && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={closeAllModals}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {detailData.TypeName}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Trạng thái: {detailData.Status}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {detailData.Title}
            </h2>

            {detailData.Description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl leading-relaxed">
                {detailData.Description}
              </p>
            )}

            {/* Evidences List */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                Tài liệu Minh chứng đính kèm ({detailData.evidences?.length || 0})
              </h3>

              {detailData.evidences?.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-soft-darkBorder space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <span>{ev.name}</span>
                  </div>

                  {ev.files?.map((f) => (
                    <div key={f.id} className="flex items-center justify-between bg-white dark:bg-soft-darkCard p-2.5 rounded-lg text-xs">
                      <div className="truncate pr-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{f.originalFileName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(f.fileSizeBytes / 1024).toFixed(1)} KB • SHA256: {f.fileHash?.slice(0, 24)}...
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(f.id, f.originalFileName)}
                        className="soft-btn-primary text-xs py-1 px-3 flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Tải về</span>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-soft-darkBorder">
              <button onClick={closeAllModals} className="soft-btn-secondary text-xs">
                Đóng
              </button>

              {detailData.Status === 'SUBMITTED' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const itm = selectedItem;
                      closeAllModals();
                      handleOpenCorrectionModal(itm);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold"
                  >
                    Yêu cầu bổ sung
                  </button>
                  <button
                    onClick={() => {
                      const itm = selectedItem;
                      closeAllModals();
                      handleOpenRejectModal(itm);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => {
                      const itm = selectedItem;
                      closeAllModals();
                      handleOpenVerifyModal(itm);
                    }}
                    className="soft-btn-primary text-xs py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white flex items-center gap-1.5 font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Phê duyệt</span>
                  </button>
                </div>
              ) : detailData.Status === 'VERIFIED' ? (
                <button
                  onClick={() => {
                    const itm = selectedItem;
                    closeAllModals();
                    handleOpenRevokeModal(itm);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Thu hồi xác nhận</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ================= 1. MODAL XÁC NHẬN PHÊ DUYỆT (VERIFIED) ================= */}
      {verifyModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button onClick={closeAllModals} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Xác nhận Phê duyệt Thành tích
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bạn đang xác nhận tính hợp lệ cho hồ sơ: <br />
              <strong className="text-slate-800 dark:text-slate-200">"{selectedItem.Title}"</strong>.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs mb-4">
              ⚠️ <strong>Lưu ý:</strong> Sau khi xác nhận (VERIFIED), hồ sơ và minh chứng số sẽ được <strong>khóa bất biến</strong>.
            </div>

            <form onSubmit={handleConfirmVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ý kiến / Lý do thẩm định xác nhận:
                </label>
                <textarea
                  rows="3"
                  value={verifyReason}
                  onChange={(e) => setVerifyReason(e.target.value)}
                  required
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeAllModals} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold disabled:opacity-50"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Xác nhận Phê duyệt (VERIFIED)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 2. MODAL YÊU CẦU BỔ SUNG (NEED_CORRECTION) ================= */}
      {correctionModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button onClick={closeAllModals} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Yêu cầu Bổ sung Minh chứng / Thông tin
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Chuyển hồ sơ <strong className="text-slate-800 dark:text-slate-200">"{selectedItem.Title}"</strong> về trạng thái <strong>Cần bổ sung (NEED_CORRECTION)</strong> để tác giả hiệu đính và nộp lại.
            </p>

            <form onSubmit={handleConfirmCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nội dung / Minh chứng cụ thể cần bổ sung <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows="3"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Ví dụ: Cần bổ sung trang bìa kỷ yếu hội thảo có mã ISBN hoặc thư chấp nhận bài báo chính thức..."
                  required
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeAllModals} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-semibold disabled:opacity-50"
                >
                  {isProcessing ? 'Đang gửi...' : 'Gửi yêu cầu Bổ sung (NEED_CORRECTION)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 3. MODAL TỪ CHỐI (REJECTED) ================= */}
      {rejectModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button onClick={closeAllModals} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Từ chối Công nhận Thành tích
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bạn đang từ chối hồ sơ: <strong className="text-slate-800 dark:text-slate-200">"{selectedItem.Title}"</strong>. Hồ sơ từ chối sẽ chuyển sang trạng thái <strong>REJECTED</strong> và kết thúc luồng thẩm định.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do từ chối chính đáng <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Minh chứng không có giá trị pháp lý hoặc không phù hợp với quy chế năm học..."
                  required
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeAllModals} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-rose-600 to-red-500 text-white font-semibold disabled:opacity-50"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Xác nhận Từ chối (REJECTED)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 4. MODAL THU HỒI (REVOKED) ================= */}
      {revokeModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button onClick={closeAllModals} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <CornerUpLeft className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Thu hồi Xác nhận Thành tích (REVOKED)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bạn đang thực hiện thu hồi hồ sơ đã xác nhận: <br />
              <strong className="text-slate-800 dark:text-slate-200">"{selectedItem.Title}"</strong>.
            </p>

            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-800 dark:text-purple-300 text-xs mb-4">
              🛡️ <strong>Theo Blueprint Mục 5:</strong> Hồ sơ sau khi thu hồi sẽ bị hủy giá trị khen thưởng, không được tính vào KPI hợp lệ và lưu vết giải trình trong lịch sử.
            </div>

            <form onSubmit={handleConfirmRevoke} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do giải trình thu hồi <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows="3"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Ví dụ: Phát hiện sai lệch số quyết định hoặc có khiếu nại bản quyền/tác giả..."
                  required
                  className="soft-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeAllModals} className="soft-btn-secondary text-xs">
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-50"
                >
                  {isProcessing ? 'Đang thu hồi...' : 'Xác nhận Thu hồi (REVOKED)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
