import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Spinner, Alert } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminUser, AdminContract, AdminCareRequest } from './admin.types';
import { getCurrentUser } from '../auth/auth.api';

export default function AdminUsers() {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lock/Activate modal state
  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Customer History Modal state
  const [historyCustomer, setHistoryCustomer] = useState<AdminUser | null>(null);
  const [customerContracts, setCustomerContracts] = useState<AdminContract[]>([]);
  const [customerRequests, setCustomerRequests] = useState<AdminCareRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  async function loadUsers() {
    try {
      setIsLoading(true);
      setActionError(null);
      const data = await adminService.fetchUsers({
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setActionError(err?.response?.data?.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle Activate / Lock
  async function handleToggleStatus(u: AdminUser) {
    const isSelf =
      u.id === currentUser?.id ||
      u.username === currentUser?.username;


    if (isSelf && u.status === 'ACTIVE') {
      setActionError('Bạn không thể tự khóa tài khoản quản trị viên của chính mình!');
      return;
    }

    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setIsUpdatingStatus(true);
      setActionError(null);
      await adminService.updateUserStatus(u.id || u.username, nextStatus);
      setActionSuccess(
        `Đã ${nextStatus === 'ACTIVE' ? 'kích hoạt' : 'khóa'} tài khoản ${u.fullName} (${u.username}) thành công`
      );
      setTargetUser(null);
      await loadUsers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Lỗi khi thay đổi trạng thái người dùng');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Open Customer History
  async function handleViewHistory(cust: AdminUser) {
    setHistoryCustomer(cust);
    setIsLoadingHistory(true);
    try {
      const history = await adminService.fetchCustomerHistory(cust.id);
      setCustomerContracts(history.contracts);
      setCustomerRequests(history.careRequests);
    } catch (err: any) {
      console.error('Failed to load customer history:', err);
      setActionError('Không thể tải lịch sử thuê và yêu cầu của khách hàng');
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function formatDate(d?: string) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('vi-VN');
  }

  function formatCurrency(v: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  }

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.toLowerCase().includes(term)) ||
      (u.id && u.id.toLowerCase().includes(term))
    );
  });

  const totalCount = users.length;
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;
  const farmerCount = users.filter((u) => u.role === 'FARMER').length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {actionSuccess && (
        <Alert variant="success" title="Thành công">
          {actionSuccess}
        </Alert>
      )}
      {actionError && (
        <Alert variant="error" title="Thông báo">
          {actionError}
        </Alert>
      )}


      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Tổng tài khoản
          </span>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalCount} Người dùng</p>
          <span className="text-2xs text-emerald-600 font-medium">{activeCount} đang hoạt động</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Khách hàng (Customer)
          </span>
          <p className="text-xl font-bold text-indigo-600 mt-1">{customerCount} Khách hàng</p>
          <span className="text-2xs text-gray-500">Người thuê ô đất</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Nông dân (Farmer)
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{farmerCount} Kỹ thuật viên</p>
          <span className="text-2xs text-gray-500">Phụ trách nông vụ</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
            Tài khoản bị khóa
          </span>
          <p className="text-xl font-bold text-rose-600 mt-1">{totalCount - activeCount} Tài khoản</p>
          <span className="text-2xs text-gray-500">Trạng thái INACTIVE / LOCKED</span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Danh Sách Tài Khoản Hệ Thống</h3>
            <p className="text-xs text-gray-500">
              Quản lý phân quyền, tra cứu lịch sử khách hàng và kích hoạt / khóa tài khoản
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Tìm tên, email, SĐT, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 w-48 sm:w-60 focus:outline-indigo-500"
            />

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="CUSTOMER">👤 Khách hàng (CUSTOMER)</option>
              <option value="FARMER">🚜 Nông dân (FARMER)</option>
              <option value="ADMIN">👑 Quản trị viên (ADMIN)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="INACTIVE">Đã khóa (INACTIVE)</option>
            </select>

            <Button variant="outline" size="sm" onClick={loadUsers} className="px-2.5">
              🔄
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="md" className="text-indigo-600 mx-auto" />
            <p className="text-xs text-gray-500 mt-2 font-medium">Đang tải danh sách người dùng...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Không tìm thấy tài khoản nào phù hợp bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Họ Tên & Tên Đăng Nhập</th>
                  <th className="px-5 py-3">Email & Số Điện Thoại</th>
                  <th className="px-5 py-3">Vai Trò (Role)</th>
                  <th className="px-5 py-3">Trạng Thái</th>
                  <th className="px-5 py-3">Ngày Tạo</th>
                  <th className="px-5 py-3 text-right">Hành Động Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((u) => {
                  const isSelf =
                    u.id === currentUser?.id ||
                    u.username === currentUser?.username;


                  return (
                    <tr key={u.id || u.username} className="hover:bg-gray-50/70 transition">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              u.role === 'ADMIN'
                                ? 'bg-indigo-100 text-indigo-700'
                                : u.role === 'FARMER'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-teal-100 text-teal-700'
                            }`}
                          >
                            {u.fullName?.slice(0, 2).toUpperCase() || 'PF'}
                          </span>
                          <div>
                            <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && (
                                <span className="text-2xs bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                                  Bạn
                                </span>
                              )}
                            </span>
                            <span className="text-2xs text-gray-400 font-mono">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <span className="text-gray-800 block">{u.email || '--'}</span>
                        <span className="text-2xs text-gray-500">{u.phone || 'Chưa cập nhật SĐT'}</span>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        {u.role === 'ADMIN' && (
                          <Badge variant="indigo" size="sm">
                            👑 ADMIN
                          </Badge>
                        )}
                        {u.role === 'FARMER' && (
                          <Badge variant="success" size="sm">
                            🚜 FARMER
                          </Badge>
                        )}
                        {u.role === 'CUSTOMER' && (
                          <Badge variant="info" size="sm">
                            👤 CUSTOMER
                          </Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>

                      {/* CreatedAt */}
                      <td className="px-5 py-3.5 text-gray-500 text-2xs">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions: Customer History & Activate/Lock */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        {/* Customer History button */}
                        {u.role === 'CUSTOMER' && (
                          <button
                            type="button"
                            onClick={() => handleViewHistory(u)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition cursor-pointer"
                          >
                            📋 Lịch sử thuê
                          </button>
                        )}

                        {/* Activate / Lock button */}
                        <button
                          type="button"
                          onClick={() => setTargetUser(u)}
                          disabled={isSelf && u.status === 'ACTIVE'}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                            isSelf && u.status === 'ACTIVE'
                              ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                              : u.status === 'ACTIVE'
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? '🔒 Khóa tài khoản' : '🔓 Kích hoạt'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ===================== MODAL: ACTIVATE / LOCK CONFIRMATION ===================== */}
      <Modal
        isOpen={targetUser !== null}
        onClose={() => setTargetUser(null)}
        title={targetUser?.status === 'ACTIVE' ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
        description={`Bạn đang thay đổi quyền truy cập của người dùng ${targetUser?.fullName} (@${targetUser?.username}).`}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-gray-800">
              <strong>Họ và tên:</strong> {targetUser?.fullName}
            </p>
            <p className="text-gray-800">
              <strong>Email:</strong> {targetUser?.email}
            </p>
            <p className="text-gray-800">
              <strong>Vai trò:</strong> {targetUser?.role}
            </p>
          </div>

          {targetUser?.status === 'ACTIVE' ? (
            <p className="text-2xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              ⚠️ Khi bị khóa, người dùng này sẽ không thể đăng nhập vào hệ thống PlotFarm cho đến khi được mở khóa lại.
            </p>
          ) : (
            <p className="text-2xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              ✅ Khi kích hoạt, người dùng sẽ có thể đăng nhập và tiếp tục các phiên làm việc bình thường.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTargetUser(null)}
              disabled={isUpdatingStatus}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className={
                targetUser?.status === 'ACTIVE'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
              onClick={() => targetUser && handleToggleStatus(targetUser)}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus
                ? 'Đang cập nhật...'
                : targetUser?.status === 'ACTIVE'
                ? 'Xác nhận khóa'
                : 'Xác nhận kích hoạt'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================== MODAL: CUSTOMER HISTORY ===================== */}
      <Modal
        isOpen={historyCustomer !== null}
        onClose={() => setHistoryCustomer(null)}
        title={`Lịch Sử Hoạt Động Khách Hàng — ${historyCustomer?.fullName}`}
        description={`Tra cứu hợp đồng thuê đất và các yêu cầu chăm sóc của khách hàng (${historyCustomer?.username}).`}
      >
        <div className="space-y-4 text-xs max-h-[500px] overflow-y-auto pr-1">
          {isLoadingHistory ? (
            <div className="p-8 text-center">
              <Spinner size="md" className="text-indigo-600 mx-auto" />
              <p className="text-xs text-gray-500 mt-2 font-medium">Đang truy xuất lịch sử dữ liệu...</p>
            </div>
          ) : (
            <>
              {/* Customer Info Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">{historyCustomer?.fullName}</h4>
                  <p className="text-2xs text-gray-500">
                    {historyCustomer?.email} • {historyCustomer?.phone || 'Chưa cập nhật SĐT'}
                  </p>
                </div>
                <Badge variant="indigo" size="sm">
                  {historyCustomer?.id}
                </Badge>
              </div>

              {/* 1. Contracts History */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-2xs flex items-center gap-1.5">
                  <span>📜</span> Hợp đồng thuê thửa đất ({customerContracts.length})
                </h4>

                {customerContracts.length === 0 ? (
                  <p className="text-gray-400 italic text-2xs bg-gray-50 p-3 rounded-lg text-center">
                    Khách hàng chưa đăng ký hợp đồng thuê đất nào.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customerContracts.map((c) => (
                      <div
                        key={c.MaHopDong}
                        className="p-2.5 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 transition text-2xs flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900">{c.MaHopDong}</span>
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
                          </div>
                          <p className="text-gray-600 mt-0.5">
                            Thửa đất: <strong>{c.TenODat}</strong> ({c.TenNongTrai}) • Cây: {c.TenCayTrong}
                          </p>
                          <p className="text-gray-400">
                            Thời hạn: {formatDate(c.NgayBatDau)} ➔ {formatDate(c.NgayKetThuc)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-700 text-xs block">
                            {formatCurrency(c.TongTien)}
                          </span>
                          <span className="text-gray-400">Cọc: {formatCurrency(c.depositAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Care Requests History */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-2xs flex items-center gap-1.5">
                  <span>💬</span> Yêu cầu chăm sóc đã gửi ({customerRequests.length})
                </h4>

                {customerRequests.length === 0 ? (
                  <p className="text-gray-400 italic text-2xs bg-gray-50 p-3 rounded-lg text-center">
                    Chưa có yêu cầu chăm sóc nào từ khách hàng này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customerRequests.map((r) => (
                      <div
                        key={r.MaYeuCau}
                        className="p-2.5 rounded-lg border border-gray-200 bg-white text-2xs space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-gray-900">
                            {r.MaYeuCau} — {r.LoaiYeuCau}
                          </span>
                          <Badge
                            variant={
                              r.TrangThai === 'COMPLETED'
                                ? 'success'
                                : r.TrangThai === 'IN_PROGRESS'
                                ? 'info'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {r.TrangThai}
                          </Badge>
                        </div>
                        <p className="text-gray-700 italic">"{r.MoTa}"</p>
                        {r.GhiChuPhanHoi && (
                          <div className="bg-emerald-50/70 p-1.5 rounded text-emerald-800 font-medium">
                            Phản hồi: {r.GhiChuPhanHoi}
                          </div>
                        )}
                        <span className="text-gray-400 block text-right">{formatDate(r.CreatedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={() => setHistoryCustomer(null)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
