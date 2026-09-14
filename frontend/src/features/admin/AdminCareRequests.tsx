import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Spinner, Alert } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminCareRequest } from './admin.types';

export default function AdminCareRequests() {
  const [requests, setRequests] = useState<AdminCareRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Processing modal state
  const [activeRequest, setActiveRequest] = useState<AdminCareRequest | null>(null);
  const [processForm, setProcessForm] = useState({
    trangThai: 'IN_PROGRESS' as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED',
    ghiChuPhanHoi: '',
    hinhAnhKetQua: '',
  });

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadCareRequests();
  }, [statusFilter]);

  async function loadCareRequests() {
    try {
      setIsLoading(true);
      setActionError(null);
      const data = await adminService.fetchCareRequests({
        trangThai: statusFilter,
      });
      setRequests(data);
    } catch (err: any) {
      console.error('Failed to load care requests:', err);
      setActionError(err?.response?.data?.message || 'Không thể tải danh sách yêu cầu chăm sóc');
    } finally {
      setIsLoading(false);
    }
  }

  function openProcessModal(req: AdminCareRequest) {
    setActiveRequest(req);
    // Auto-advance workflow status recommendation
    let nextStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' = 'IN_PROGRESS';
    if (req.TrangThai === 'PENDING') nextStatus = 'IN_PROGRESS';
    else if (req.TrangThai === 'IN_PROGRESS') nextStatus = 'COMPLETED';
    else nextStatus = req.TrangThai;

    setProcessForm({
      trangThai: nextStatus,
      ghiChuPhanHoi: req.GhiChuPhanHoi || '',
      hinhAnhKetQua: req.HinhAnhKetQua || '',
    });
    setActionError(null);
  }

  async function handleSubmitProcess(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRequest) return;

    try {
      setIsSubmitting(true);
      setActionError(null);
      await adminService.updateCareRequestStatus(activeRequest.MaYeuCau, {
        trangThai: processForm.trangThai,
        ghiChuPhanHoi: processForm.ghiChuPhanHoi.trim() || undefined,
        hinhAnhKetQua: processForm.hinhAnhKetQua.trim() || undefined,
      });
      setActionSuccess(`Đã xử lý yêu cầu ${activeRequest.MaYeuCau} thành [${processForm.trangThai}]`);
      setActiveRequest(null);
      await loadCareRequests();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Lỗi khi cập nhật yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(d?: string) {
    if (!d) return '--';
    return new Date(d).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const filteredRequests = requests.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.MaYeuCau.toLowerCase().includes(term) ||
      (r.TenKH && r.TenKH.toLowerCase().includes(term)) ||
      (r.TenODat && r.TenODat.toLowerCase().includes(term)) ||
      (r.TenNongDanPhuTrach && r.TenNongDanPhuTrach.toLowerCase().includes(term)) ||
      (r.LoaiYeuCau && r.LoaiYeuCau.toLowerCase().includes(term)) ||
      (r.MoTa && r.MoTa.toLowerCase().includes(term))
    );
  });

  const pendingCount = requests.filter((r) => r.TrangThai === 'PENDING').length;
  const inProgressCount = requests.filter((r) => r.TrangThai === 'IN_PROGRESS').length;
  const completedCount = requests.filter((r) => r.TrangThai === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {actionSuccess && (
        <Alert variant="success" title="Thành công">
          {actionSuccess}
        </Alert>
      )}
      {actionError && (
        <Alert variant="error" title="Lỗi xử lý">
          {actionError}
        </Alert>
      )}


      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-rose-600">
            Chờ tiếp nhận (PENDING)
          </span>
          <p className="text-2xl font-black text-rose-700 mt-1">{pendingCount} Yêu cầu</p>
          <span className="text-2xs text-rose-500">Cần phân công kỹ thuật xử lý</span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-blue-600">
            Đang thực hiện (IN_PROGRESS)
          </span>
          <p className="text-2xl font-black text-blue-700 mt-1">{inProgressCount} Yêu cầu</p>
          <span className="text-2xs text-blue-500">Nông dân đang chăm sóc thực địa</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">
            Đã hoàn thành (COMPLETED)
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{completedCount} Yêu cầu</p>
          <span className="text-2xs text-emerald-500">Đã cập nhật ảnh & phản hồi</span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Điều Phối Yêu Cầu Chăm Sóc Nông Vụ</h3>
            <p className="text-xs text-gray-500">
              Quy trình xử lý chuẩn: PENDING ➔ IN_PROGRESS ➔ COMPLETED kèm phản hồi và ảnh kết quả
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Tìm khách hàng, ô đất, nông dân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 w-48 sm:w-64 focus:outline-indigo-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý (PENDING)</option>
              <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
              <option value="COMPLETED">Đã xong (COMPLETED)</option>
              <option value="REJECTED">Từ chối (REJECTED)</option>
            </select>

            <Button variant="outline" size="sm" onClick={loadCareRequests} className="px-2.5">
              🔄
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="md" className="text-indigo-600 mx-auto" />
            <p className="text-xs text-gray-500 mt-2 font-medium">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Không có yêu cầu chăm sóc nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Mã & Ngày gửi</th>
                  <th className="px-4 py-3">Khách Hàng</th>
                  <th className="px-4 py-3">Thửa Đất</th>
                  <th className="px-4 py-3">Nông Dân Phụ Trách</th>
                  <th className="px-4 py-3">Loại Yêu Cầu</th>
                  <th className="px-4 py-3">Nội Dung Yêu Cầu</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3">Kết Quả Xử Lý</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRequests.map((r) => (
                  <tr key={r.MaYeuCau} className="hover:bg-gray-50/70 transition">
                    {/* ID & Date */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-gray-900 block">{r.MaYeuCau}</span>
                      <span className="text-2xs text-gray-400 font-sans">{formatDate(r.CreatedAt)}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-900 block">{r.TenKH || r.MaKH}</span>
                      <span className="text-2xs text-gray-500">{r.DienThoaiKhachHang || r.EmailKhachHang}</span>
                    </td>

                    {/* Plot */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-800 block">{r.TenODat || r.MaODat}</span>
                      <span className="text-2xs text-gray-400 font-mono">{r.MaHopDong}</span>
                    </td>

                    {/* Assigned Farmer */}
                    <td className="px-4 py-3.5">
                      {r.TenNongDanPhuTrach ? (
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xs">
                            🌾
                          </span>
                          <span className="font-medium text-gray-800">{r.TenNongDanPhuTrach}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-2xs">Theo quản trại</span>
                      )}
                    </td>

                    {/* Request Type */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {r.LoaiYeuCau}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="text-gray-800 line-clamp-2" title={r.MoTa}>
                        {r.MoTa}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          r.TrangThai === 'PENDING'
                            ? 'warning'
                            : r.TrangThai === 'IN_PROGRESS'
                            ? 'info'
                            : r.TrangThai === 'COMPLETED'
                            ? 'success'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {r.TrangThai === 'PENDING'
                          ? 'Chờ duyệt'
                          : r.TrangThai === 'IN_PROGRESS'
                          ? 'Đang làm'
                          : r.TrangThai === 'COMPLETED'
                          ? 'Đã xong'
                          : 'Từ chối'}
                      </Badge>
                    </td>

                    {/* Result image & note */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {r.HinhAnhKetQua ? (
                          <img
                            src={r.HinhAnhKetQua}
                            alt="Result"
                            onClick={() => setPreviewImage(r.HinhAnhKetQua!)}
                            className="h-8 w-8 rounded-md object-cover border border-gray-200 cursor-pointer hover:scale-105 transition shrink-0"
                            title="Bấm để phóng to ảnh kết quả"
                          />
                        ) : null}
                        {r.GhiChuPhanHoi ? (
                          <span
                            className="text-2xs text-gray-600 truncate max-w-[120px] block"
                            title={r.GhiChuPhanHoi}
                          >
                            📝 {r.GhiChuPhanHoi}
                          </span>
                        ) : (
                          <span className="text-2xs text-gray-400 italic">Chưa phản hồi</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1"
                        onClick={() => openProcessModal(r)}
                      >
                        ⚙️ Tiến trình
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ===================== WORKFLOW PROCESSING MODAL ===================== */}
      <Modal
        isOpen={activeRequest !== null}
        onClose={() => setActiveRequest(null)}
        title={`Xử Lý Yêu Cầu Chăm Sóc — ${activeRequest?.MaYeuCau}`}
        description="Cập nhật tiến trình thực thi, ghi chú của kỹ thuật viên và hình ảnh kết quả thực địa."
      >
        <form onSubmit={handleSubmitProcess} className="space-y-4 text-xs">
          {/* Request Overview Header */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Khách hàng:</span>
              <span className="font-bold text-gray-900">{activeRequest?.TenKH}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Thửa đất:</span>
              <span className="font-semibold text-gray-800">{activeRequest?.TenODat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Loại yêu cầu:</span>
              <span className="font-semibold text-indigo-700">{activeRequest?.LoaiYeuCau}</span>
            </div>
            <div className="pt-1 text-gray-700 border-t border-slate-200/60 mt-1">
              <span className="text-gray-500 block">Nội dung yêu cầu từ khách:</span>
              <p className="italic bg-white p-2 rounded border border-gray-200 mt-0.5">
                "{activeRequest?.MoTa}"
              </p>
            </div>
          </div>

          {/* Workflow Status Selector */}
          <div>
            <label className="block font-bold text-gray-800 mb-1.5">
              Bước xử lý tiếp theo (Workflow Transition) *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition text-center ${
                  processForm.trangThai === 'PENDING'
                    ? 'border-amber-500 bg-amber-50 font-bold text-amber-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="processStatus"
                  value="PENDING"
                  checked={processForm.trangThai === 'PENDING'}
                  onChange={() => setProcessForm({ ...processForm, trangThai: 'PENDING' })}
                  className="sr-only"
                />
                <span className="text-base">⏳</span>
                <span className="text-2xs mt-1">1. PENDING</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition text-center ${
                  processForm.trangThai === 'IN_PROGRESS'
                    ? 'border-blue-500 bg-blue-50 font-bold text-blue-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="processStatus"
                  value="IN_PROGRESS"
                  checked={processForm.trangThai === 'IN_PROGRESS'}
                  onChange={() => setProcessForm({ ...processForm, trangThai: 'IN_PROGRESS' })}
                  className="sr-only"
                />
                <span className="text-base">🚜</span>
                <span className="text-2xs mt-1">2. IN_PROGRESS</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition text-center ${
                  processForm.trangThai === 'COMPLETED'
                    ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="processStatus"
                  value="COMPLETED"
                  checked={processForm.trangThai === 'COMPLETED'}
                  onChange={() => setProcessForm({ ...processForm, trangThai: 'COMPLETED' })}
                  className="sr-only"
                />
                <span className="text-base">✅</span>
                <span className="text-2xs mt-1">3. COMPLETED</span>
              </label>
            </div>
          </div>

          {/* Response Note */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Ghi chú phản hồi của Kỹ thuật / Nông dân (Response note)
            </label>
            <textarea
              rows={3}
              value={processForm.ghiChuPhanHoi}
              onChange={(e) => setProcessForm({ ...processForm, ghiChuPhanHoi: e.target.value })}
              placeholder="VD: Đã hoàn tất việc bón phân hữu cơ và tưới đẫm vào sáng nay lúc 8h."
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Result Image URL */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Ảnh kết quả thực địa (Result Image URL)
            </label>
            <Input
              value={processForm.hinhAnhKetQua}
              onChange={(e) => setProcessForm({ ...processForm, hinhAnhKetQua: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
            />
            {processForm.hinhAnhKetQua && (
              <div className="mt-2 p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-3">
                <img
                  src={processForm.hinhAnhKetQua}
                  alt="Live preview"
                  className="h-14 w-14 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-2xs text-gray-500">Xem trước ảnh thực địa sẽ hiển thị cho khách</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveRequest(null)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu kết quả xử lý'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={previewImage !== null}
        onClose={() => setPreviewImage(null)}
        title="Ảnh minh chứng kết quả chăm sóc"
        description="Hình ảnh chụp thực tế tại thửa đất của khách hàng."
      >
        {previewImage && (
          <div className="text-center">
            <img
              src={previewImage}
              alt="Result evidence preview"
              className="max-h-[400px] w-full object-contain rounded-xl shadow-xs mx-auto"
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setPreviewImage(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
