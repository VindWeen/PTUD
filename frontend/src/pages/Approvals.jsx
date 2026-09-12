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
} from 'lucide-react';

export default function Approvals() {
  const { user } = useAuth();

  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState('');

  // Selected for review & verify modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyReason, setVerifyReason] = useState('Hồ sơ và minh chứng số hợp lệ, đã thẩm định đạt yêu cầu.');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      setPendingList(res.data || []);
    } catch (err) {
      console.error('Lỗi nạp hàng chờ duyệt:', err);
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Không thể tải danh sách chờ duyệt',
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

  const handleOpenVerifyModal = (item) => {
    setSelectedItem(item);
    setVerifyReason('Hồ sơ và minh chứng số hợp lệ, đã thẩm định đạt yêu cầu.');
    setVerifyModalOpen(true);
  };

  const handleConfirmVerify = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsVerifying(true);
    setFeedback(null);

    try {
      await api.post(`/approvals/${selectedItem.Id}/verify`, {
        reason: verifyReason.trim() || 'Xác nhận thành tích hợp lệ',
      });

      setFeedback({
        type: 'success',
        text: `Đã phê duyệt thành công hồ sơ "${selectedItem.Title}" (Trạng thái: VERIFIED)!`,
      });

      setVerifyModalOpen(false);
      setSelectedItem(null);
      setDetailData(null);
      loadPendingApprovals();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Lỗi khi phê duyệt hồ sơ',
      });
    } finally {
      setIsVerifying(false);
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

  const filteredPending = pendingList.filter((item) => {
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
            Hàng chờ Xét duyệt Thành tích
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dành cho Cán bộ Quản lý (Manager) thẩm định minh chứng số và phê duyệt trong phạm vi phân công.
          </p>
        </div>

        <button
          onClick={loadPendingApprovals}
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
          <div className="font-bold">Quy tắc Nghiệp vụ Phê duyệt (Blueprint Mục 4 & 5):</div>
          <div className="text-[11px] text-amber-800/90 dark:text-amber-300 leading-relaxed">
            • <strong>Phạm vi thẩm quyền:</strong> Bạn đang kiểm duyệt các hồ sơ thuộc:{' '}
            <span className="font-semibold underline">
              {user?.unitScopes?.[0]?.UnitName || 'Khoa Công nghệ Thông tin'} (kèm các Bộ môn trực thuộc)
            </span>
            .<br />
            • <strong>Chống tự duyệt:</strong> Hệ thống tự động ẩn các hồ sơ do chính bạn kê khai khỏi hàng chờ này để bảo đảm tính khách quan.
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

      {/* Filter and Search Bar */}
      <div className="soft-card p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề bài báo, tên tác giả, đơn vị..."
            className="soft-input w-full pl-10 text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
          Đang chờ xử lý: <span className="text-amber-600 dark:text-amber-400 font-bold">{pendingList.length}</span> hồ sơ
        </div>
      </div>

      {/* Pending Items List */}
      {loading ? (
        <div className="soft-card p-12 text-center text-slate-400 text-xs animate-pulse">
          Đang tải hàng chờ xét duyệt từ máy chủ...
        </div>
      ) : filteredPending.length === 0 ? (
        <div className="soft-card p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Hàng chờ xét duyệt hiện đang trống
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {search
              ? 'Không tìm thấy hồ sơ nào khớp với từ khóa tìm kiếm.'
              : 'Tất cả các hồ sơ thành tích trong phạm vi đơn vị phụ trách đã được xử lý xong!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPending.map((item) => (
            <div
              key={item.Id}
              className="soft-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-soft-md transition-all duration-200 border border-transparent hover:border-amber-500/20"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    {item.TypeName}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
                    <Clock className="w-3 h-3" />
                    Chờ duyệt (Lần {item.RevisionNo || 1})
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Nộp ngày: {new Date(item.SubmittedAt || item.CreatedAt).toLocaleDateString('vi-VN')}
                  </span>
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
                    <span>Đơn vị: {item.ContextUnitName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold">
                    <span className="text-slate-400">•</span>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{item.EvidencesCount || 0} minh chứng số</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                <button
                  onClick={() => handleOpenReview(item)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem minh chứng</span>
                </button>

                <button
                  onClick={() => handleOpenVerifyModal(item)}
                  className="soft-btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-soft-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phê duyệt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL XEM MINH CHỨNG ================= */}
      {selectedItem && !verifyModalOpen && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedItem(null);
                setDetailData(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {detailData.TypeName}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" />
                Chờ duyệt
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
                Tài liệu Minh chứng đính kèm
              </h3>

              {detailData.evidences?.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-soft-darkBorder space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <span>{ev.name}</span>
                  </div>

                  {ev.files?.map((f) => (
                    <div key={f.id} className="flex items-center justify-between bg-white dark:bg-soft-darkCard p-2.5 rounded-lg text-xs">
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{f.originalFileName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(f.fileSizeBytes / 1024).toFixed(1)} KB • SHA256: {f.fileHash?.slice(0, 20)}...
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

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-soft-darkBorder">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setDetailData(null);
                }}
                className="soft-btn-secondary text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => handleOpenVerifyModal(selectedItem)}
                className="soft-btn-primary text-xs py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tiến hành Phê duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN PHÊ DUYỆT ================= */}
      {verifyModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="soft-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setVerifyModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
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
              ⚠️ <strong>Lưu ý:</strong> Sau khi xác nhận (VERIFIED), hồ sơ và minh chứng số sẽ được <strong>khóa bất biến</strong>. Mọi chỉnh sửa sau này đều phải qua quy trình thu hồi (REVOKE).
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
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="soft-btn-secondary text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="soft-btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white disabled:opacity-50"
                >
                  {isVerifying ? 'Đang xác nhận...' : 'Xác nhận Phê duyệt (VERIFIED)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

