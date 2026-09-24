import { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminPayment } from './admin.types';

export default function AdminPayments() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [statusFilter, methodFilter]);

  async function loadPayments() {
    try {
      setIsLoading(true);
      setActionError(null);
      const data = await adminService.fetchPayments({
        trangThai: statusFilter,
        phuongThuc: methodFilter,
      });
      setPayments(data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setActionError(err?.response?.data?.message || 'Không thể tải danh sách giao dịch thanh toán');
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  function formatDate(d?: string) {
    if (!d) return '--';
    return new Date(d).toLocaleString('vi-VN');
  }

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.MaThanhToan.toLowerCase().includes(term) ||
      p.MaHopDong.toLowerCase().includes(term) ||
      (p.TenKH && p.TenKH.toLowerCase().includes(term)) ||
      (p.NoiDungCK && p.NoiDungCK.toLowerCase().includes(term))
    );
  });

  const totalSuccessAmount = payments
    .filter((p) => p.TrangThai === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.SoTien) || 0), 0);
  const completedCount = payments.filter((p) => p.TrangThai === 'COMPLETED').length;
  const pendingCount = payments.filter((p) => p.TrangThai === 'PENDING').length;

  return (
    <div className="space-y-6">
      {actionError && (
        <Alert variant="error" title="Lỗi">
          {actionError}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-800">
            Tổng thu thực tế (COMPLETED)
          </span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalSuccessAmount)}</p>
          <span className="text-2xs text-emerald-600">{completedCount} giao dịch hoàn tất</span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-amber-800">
            Giao dịch chờ xác nhận (PENDING)
          </span>
          <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount} Giao dịch</p>
          <span className="text-2xs text-amber-700">Khách hàng đang chuyển khoản</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Tổng số bản ghi giao dịch
          </span>
          <p className="text-xl font-bold text-gray-900 mt-1">{payments.length} Giao dịch</p>
          <span className="text-2xs text-gray-500">Bao gồm tất cả các cổng</span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Nhật Ký Giao Dịch &amp; Thanh Toán</h3>
            <p className="text-xs text-gray-500">
              Tra cứu mã chuyển khoản, ngân hàng thụ hưởng và đối soát với hệ thống hợp đồng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Tìm mã GD, HĐ, khách hàng, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 w-48 sm:w-60 focus:outline-indigo-500"
            />

            {/* Phương thức */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
            >
              <option value="ALL">Tất cả phương thức</option>
              <option value="VIETQR">VietQR (Ngân hàng)</option>
              <option value="VNPAY">Cổng VNPAY</option>
              <option value="MOMO">Ví MoMo</option>
            </select>

            {/* Trạng thái */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ thanh toán (PENDING)</option>
              <option value="COMPLETED">Thành công (COMPLETED)</option>
              <option value="FAILED">Thất bại (FAILED)</option>
              <option value="REFUNDED">Hoàn tiền (REFUNDED)</option>
            </select>

            <Button variant="outline" size="sm" onClick={loadPayments} className="px-2.5">
              🔄
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="md" className="text-indigo-600 mx-auto" />
            <p className="text-xs text-gray-500 mt-2 font-medium">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Không có giao dịch nào phù hợp điều kiện lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Mã Giao Dịch</th>
                  <th className="px-4 py-3">Khách Hàng</th>
                  <th className="px-4 py-3">Mã Hợp Đồng</th>
                  <th className="px-4 py-3">Số Tiền</th>
                  <th className="px-4 py-3">Phương Thức</th>
                  <th className="px-4 py-3">Nội Dung Chuyển Khoản</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3">Thời Gian Ghi Nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPayments.map((p) => (
                  <tr key={p.MaThanhToan} className="hover:bg-gray-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">
                      {p.MaThanhToan}
                      {p.MaGiaoDich && (
                        <span className="block text-3xs font-mono text-gray-400 font-normal">
                          Ref: {p.MaGiaoDich}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 block">{p.TenKH || p.MaKH}</span>
                      <span className="text-2xs text-gray-500">{p.DienThoai || p.Email}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-indigo-700 block">{p.MaHopDong}</span>
                      {p.TenODat && (
                        <span className="text-2xs text-gray-500">{p.TenODat} ({p.TenNongTrai})</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-bold text-emerald-800">
                      {formatCurrency(p.SoTien)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {p.PhuongThuc === 'VIETQR' ? '📲 VietQR' : p.PhuongThuc === 'VNPAY' ? '💳 VNPay' : '👛 MoMo'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-emerald-900 text-2xs select-all">
                        {p.NoiDungCK}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          p.TrangThai === 'COMPLETED'
                            ? 'success'
                            : p.TrangThai === 'PENDING'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {p.TrangThai === 'COMPLETED'
                          ? 'Thành công'
                          : p.TrangThai === 'PENDING'
                          ? 'Đang chờ'
                          : p.TrangThai}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-2xs">
                      {formatDate(p.CreatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}