import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Spinner, Alert } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminContract } from './admin.types';

export default function AdminContracts() {
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Status transition modal state
  const [selectedContract, setSelectedContract] = useState<AdminContract | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  async function loadContracts() {
    try {
      setIsLoading(true);
      setActionError(null);
      const data = await adminService.fetchContracts({
        trangThai: statusFilter,
      });
      setContracts(data);
    } catch (err: any) {
      console.error('Failed to load contracts:', err);
      setActionError(err?.response?.data?.message || 'Không thể tải danh sách hợp đồng');
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  function formatDate(d?: string) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('vi-VN');
  }

  function openStatusModal(contract: AdminContract, status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') {
    setSelectedContract(contract);
    setTargetStatus(status);
    setActionError(null);
  }

  async function handleConfirmStatusChange() {
    if (!selectedContract) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await adminService.updateContractStatus(selectedContract.MaHopDong, targetStatus);
      setActionSuccess(
        `Đã chuyển trạng thái hợp đồng ${selectedContract.MaHopDong} sang ${targetStatus}`
      );
      setSelectedContract(null);
      await loadContracts();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái hợp đồng');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filtered by search
  const filteredContracts = contracts.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.MaHopDong.toLowerCase().includes(term) ||
      (c.TenKH && c.TenKH.toLowerCase().includes(term)) ||
      (c.TenODat && c.TenODat.toLowerCase().includes(term)) ||
      (c.TenNongTrai && c.TenNongTrai.toLowerCase().includes(term)) ||
      (c.TenCayTrong && c.TenCayTrong.toLowerCase().includes(term))
    );
  });

  const activeCount = contracts.filter((c) => c.TrangThai === 'ACTIVE').length;
  const completedCount = contracts.filter((c) => c.TrangThai === 'COMPLETED').length;
  const totalValue = contracts.reduce((acc, c) => acc + (Number(c.TongTien) || 0), 0);

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


      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Hợp đồng đang hiệu lực
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{activeCount} Hợp đồng</p>
          <span className="text-2xs text-gray-500">Đang được quản lý canh tác</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Hợp đồng đã hoàn tất
          </span>
          <p className="text-xl font-bold text-indigo-600 mt-1">{completedCount} Hợp đồng</p>
          <span className="text-2xs text-gray-500">Đã thu hoạch và thanh lý</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Tổng giá trị hợp đồng
          </span>
          <p className="text-xl font-bold text-indigo-950 mt-1">{formatCurrency(totalValue)}</p>
          <span className="text-2xs text-gray-500">Toàn bộ giá trị hệ thống</span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        {/* Controls Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Quản Trị Hợp Đồng Thuê Đất</h3>
            <p className="text-xs text-gray-500">
              Giám sát khách hàng, ô đất, cây trồng, tiền cọc và điều phối trạng thái hợp đồng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Tìm mã HĐ, khách hàng, ô đất..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 w-48 sm:w-60 focus:outline-indigo-500"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang thuê (ACTIVE)</option>
              <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>

            <Button variant="outline" size="sm" onClick={loadContracts} className="px-2.5">
              🔄
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="md" className="text-indigo-600 mx-auto" />
            <p className="text-xs text-gray-500 mt-2 font-medium">Đang tải danh sách hợp đồng...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Không tìm thấy hợp đồng nào phù hợp điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Mã HĐ</th>
                  <th className="px-4 py-3">Khách Hàng</th>
                  <th className="px-4 py-3">Thửa Đất & Nông Trại</th>
                  <th className="px-4 py-3">Cây Trồng</th>
                  <th className="px-4 py-3">Thời Hạn Thuê</th>
                  <th className="px-4 py-3">Tiền Cọc (30%)</th>
                  <th className="px-4 py-3">Tổng Tiền</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3 text-right">Thao Tác Chuyển Đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredContracts.map((c) => (
                  <tr key={c.MaHopDong} className="hover:bg-gray-50/70 transition">
                    {/* Contract ID */}
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">
                      {c.MaHopDong}
                      {c.CreatedAt && (
                        <span className="block text-2xs font-sans text-gray-400 font-normal">
                          {formatDate(c.CreatedAt)}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 block">{c.TenKH || c.MaKH}</span>
                      <span className="text-2xs text-gray-500">{c.DienThoai || c.Email || c.MaKH}</span>
                    </td>

                    {/* Plot & Farm */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800 block">{c.TenODat || c.MaODat}</span>
                      <span className="text-2xs text-gray-500">{c.TenNongTrai || 'Nông trại PlotFarm'}</span>
                    </td>

                    {/* Crop */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-2xs">
                        🌱 {c.TenCayTrong || c.MaCayTrong}
                      </span>
                    </td>

                    {/* Start Date - End Date */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <div>Từ: {formatDate(c.NgayBatDau)}</div>
                      <div className="text-gray-400">Đến: {formatDate(c.NgayKetThuc)}</div>
                    </td>

                    {/* Deposit */}
                    <td className="px-4 py-3 font-medium text-amber-700">
                      {formatCurrency(c.depositAmount)}
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3 font-bold text-indigo-900">
                      {formatCurrency(c.TongTien)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          c.TrangThai === 'ACTIVE'
                            ? 'success'
                            : c.TrangThai === 'COMPLETED'
                            ? 'indigo'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {c.TrangThai}
                      </Badge>
                    </td>

                    {/* Actions: ACTIVE / COMPLETED / CANCELLED */}
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      {c.TrangThai !== 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => openStatusModal(c, 'ACTIVE')}
                          className="px-2 py-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition cursor-pointer"
                        >
                          Kích hoạt (ACTIVE)
                        </button>
                      )}
                      {c.TrangThai !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => openStatusModal(c, 'COMPLETED')}
                          className="px-2 py-1 text-2xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition cursor-pointer"
                        >
                          Hoàn tất (COMPLETED)
                        </button>
                      )}
                      {c.TrangThai !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => openStatusModal(c, 'CANCELLED')}
                          className="px-2 py-1 text-2xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition cursor-pointer"
                        >
                          Hủy (CANCELLED)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Modal for Status Transition */}
      <Modal
        isOpen={selectedContract !== null}
        onClose={() => setSelectedContract(null)}
        title="Xác nhận chuyển trạng thái hợp đồng"
        description={`Bạn đang thao tác đổi trạng thái hợp đồng ${selectedContract?.MaHopDong} sang ${targetStatus}.`}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-gray-700">
              <strong>Khách hàng:</strong> {selectedContract?.TenKH}
            </p>
            <p className="text-gray-700">
              <strong>Thửa đất:</strong> {selectedContract?.TenODat} ({selectedContract?.TenNongTrai})
            </p>
            <p className="text-gray-700">
              <strong>Tổng tiền:</strong> {formatCurrency(selectedContract?.TongTien || 0)}
            </p>
          </div>

          {(targetStatus === 'COMPLETED' || targetStatus === 'CANCELLED') && (
            <p className="text-2xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              ⚠️ Lưu ý: Khi chuyển sang <strong>{targetStatus}</strong>, hệ thống sẽ tự động giải phóng
              ô đất <strong>{selectedContract?.TenODat}</strong> về trạng thái <strong>TRỐNG (TRONG)</strong> để
              khách hàng khác có thể thuê lại.
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedContract(null)}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className={
                targetStatus === 'ACTIVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : targetStatus === 'COMPLETED'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }
              onClick={handleConfirmStatusChange}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang cập nhật...' : `Xác nhận chuyển sang ${targetStatus}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
