import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Spinner, Alert, SmsSimulatorModal, type SmsNotificationPayload } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminUser, AdminContract, AdminCareRequest, FarmerApplication } from './admin.types';
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

  // ── Tab State: 'USERS' | 'APPLICATIONS' ──
  const [activeTab, setActiveTab] = useState<'USERS' | 'APPLICATIONS'>('USERS');

  // ── Farmer Applications State ──
  const [applications, setApplications] = useState<FarmerApplication[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('ALL');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Detail modal, Reject modal, and Photo zoom modal
  const [selectedApp, setSelectedApp] = useState<FarmerApplication | null>(null);
  const [rejectingApp, setRejectingApp] = useState<FarmerApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingApp, setIsProcessingApp] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);

  // Visual SMS Simulator Modal State
  const [smsData, setSmsData] = useState<SmsNotificationPayload | null>(null);
  const [isSmsOpen, setIsSmsOpen] = useState(false);

  useEffect(() => {
    loadUsers();
    loadApplications();
  }, [roleFilter, statusFilter, appStatusFilter]);

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

  async function loadApplications() {
    try {
      setIsLoadingApps(true);
      const data = await adminService.fetchFarmerApplications(appStatusFilter);
      setApplications(data);
    } catch (err: any) {
      console.error('Failed to load farmer applications:', err);
    } finally {
      setIsLoadingApps(false);
    }
  }

  // Handle Approve Farmer Application -> triggers visual SMS simulator
  async function handleApproveApplication(app: FarmerApplication) {
    try {
      setIsProcessingApp(true);
      setActionError(null);
      const res = await adminService.approveFarmerApplication(app.MaDon);
      setActionSuccess(`Đã phê duyệt hồ sơ của ${app.HoTen} thành công! Tài khoản ${app.TenDangNhap} đã kích hoạt.`);
      setSelectedApp(null);

      // Trigger visual SMS simulation popup
      if (res.smsNotification) {
        setSmsData(res.smsNotification);
        setIsSmsOpen(true);
      }

      await Promise.all([loadApplications(), loadUsers()]);
    } catch (err: any) {
      console.error('Approve application error:', err);
      setActionError(err?.response?.data?.message || err?.message || 'Lỗi khi phê duyệt hồ sơ');
    } finally {
      setIsProcessingApp(false);
    }
  }

  // Handle Reject Farmer Application
  async function handleConfirmReject() {
    if (!rejectingApp) return;
    try {
      setIsProcessingApp(true);
      setActionError(null);
      const res = await adminService.rejectFarmerApplication(rejectingApp.MaDon, rejectReason);
      setActionSuccess(`Đã từ chối hồ sơ của ${rejectingApp.HoTen}.`);
      setRejectingApp(null);
      setRejectReason('');
      setSelectedApp(null);

      if (res?.data?.smsNotification || res?.smsNotification) {
        setSmsData(res.data?.smsNotification || res.smsNotification);
        setIsSmsOpen(true);
      }

      await loadApplications();
    } catch (err: any) {
      console.error('Reject application error:', err);
      setActionError(err?.response?.data?.message || err?.message || 'Lỗi khi từ chối hồ sơ');
    } finally {
      setIsProcessingApp(false);
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

  const pendingAppsCount = applications.filter((a) => a.TrangThai === 'PENDING').length;
  const approvedAppsCount = applications.filter((a) => a.TrangThai === 'APPROVED').length;
  const rejectedAppsCount = applications.filter((a) => a.TrangThai === 'REJECTED').length;

  const filteredApplications = applications.filter((a) => {
    if (!appSearchTerm.trim()) return true;
    const term = appSearchTerm.toLowerCase();
    return (
      (a.HoTen && a.HoTen.toLowerCase().includes(term)) ||
      (a.TenDangNhap && a.TenDangNhap.toLowerCase().includes(term)) ||
      (a.Email && a.Email.toLowerCase().includes(term)) ||
      (a.DienThoai && a.DienThoai.toLowerCase().includes(term)) ||
      (a.SoCCCD && a.SoCCCD.toLowerCase().includes(term)) ||
      (a.MaDon && a.MaDon.toLowerCase().includes(term))
    );
  });

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

      {/* ── Main Tab Switcher ── */}
      <div className="flex border-b border-gray-200 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>👥</span> Danh Sách Tài Khoản ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'APPLICATIONS'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>📋</span> Duyệt Hồ Sơ Nông Dân
          {pendingAppsCount > 0 ? (
            <span className="bg-amber-500 text-white text-2xs px-2 py-0.5 rounded-full font-bold animate-pulse">
              {pendingAppsCount} chờ duyệt
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-600 text-2xs px-2 py-0.5 rounded-full">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* ── VIEW 1: USER ACCOUNTS ── */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* ── VIEW 2: FARMER PARTNER APPLICATIONS (KYC & SMS APPROVAL) ── */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-6">
          {/* Applications KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
              <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">
                Tổng hồ sơ nộp
              </span>
              <p className="text-xl font-bold text-gray-900 mt-1">{applications.length} Ứng viên</p>
              <span className="text-2xs text-gray-500">Đối tác Nông Dân</span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <span className="text-2xs font-semibold uppercase tracking-wider text-amber-700">
                Đang chờ xét duyệt
              </span>
              <p className="text-xl font-bold text-amber-600 mt-1">{pendingAppsCount} Hồ sơ</p>
              <span className="text-2xs text-amber-600 font-medium">Cần thẩm định CCCD 2 mặt</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-700">
                Đã phê duyệt
              </span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{approvedAppsCount} Nông dân</p>
              <span className="text-2xs text-emerald-600 font-medium">Đã kích hoạt &amp; gửi SMS</span>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <span className="text-2xs font-semibold uppercase tracking-wider text-rose-700">
                Đã từ chối
              </span>
              <p className="text-xl font-bold text-rose-600 mt-1">{rejectedAppsCount} Hồ sơ</p>
              <span className="text-2xs text-gray-500">Không đạt tiêu chí</span>
            </div>
          </div>

          {/* Applications Table Card */}
          <Card>
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Danh Sách Hồ Sơ Đối Tác Nông Dân</h3>
                <p className="text-xs text-gray-500">
                  Thẩm định thông tin định danh CCCD 2 mặt, phê duyệt và kích hoạt tài khoản kèm gửi tin nhắn SMS
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Tìm tên, CCCD, SĐT, username..."
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                  className="text-xs rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 w-48 sm:w-60 focus:outline-emerald-500"
                />

                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-emerald-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">🟡 Chờ duyệt (PENDING)</option>
                  <option value="APPROVED">🟢 Đã duyệt (APPROVED)</option>
                  <option value="REJECTED">🔴 Đã từ chối (REJECTED)</option>
                </select>

                <Button variant="outline" size="sm" onClick={loadApplications} className="px-2.5">
                  🔄
                </Button>
              </div>
            </div>

            {isLoadingApps ? (
              <div className="p-12 text-center">
                <Spinner size="md" />
                <p className="text-xs text-gray-500 mt-2">Đang tải danh sách hồ sơ nông dân...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <span className="text-3xl block mb-1">📭</span>
                <p className="font-medium text-xs">Không có hồ sơ nào phù hợp.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-2xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Mã đơn</th>
                      <th className="px-4 py-3">Ứng viên &amp; CCCD</th>
                      <th className="px-4 py-3">Điện thoại nhận SMS</th>
                      <th className="px-4 py-3">Tài khoản &amp; Chuyên môn</th>
                      <th className="px-4 py-3">Ảnh CCCD 2 mặt</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Ngày nộp</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApplications.map((app) => (
                      <tr key={app.MaDon} className="hover:bg-gray-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900">
                          {app.MaDon}
                        </td>

                        <td className="px-4 py-3">
                          <strong className="text-gray-900 block">{app.HoTen}</strong>
                          <span className="font-mono text-2xs text-gray-500 block">
                            CCCD: <strong className="text-gray-700">{app.SoCCCD}</strong>
                          </span>
                          {app.DiaChi && (
                            <span className="text-3xs text-gray-400 block truncate max-w-xs" title={app.DiaChi}>
                              📍 {app.DiaChi}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-2xs">
                            📱 {app.DienThoai}
                          </span>
                          <span className="text-3xs text-gray-400 block mt-0.5">{app.Email}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-gray-800 block">
                            @{app.TenDangNhap}
                          </span>
                          <span className="text-3xs text-gray-500 block line-clamp-1 max-w-xs">
                            {app.KinhNghiem || 'Kinh nghiệm tổng quát'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {app.AnhCCCDMatTruoc ? (
                              <img
                                src={app.AnhCCCDMatTruoc}
                                alt="Mặt trước"
                                onClick={() => setZoomedImage({ src: app.AnhCCCDMatTruoc!, title: `Mặt trước CCCD - ${app.HoTen}` })}
                                className="h-8 w-12 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 shadow-2xs"
                                title="Bấm để phóng to"
                              />
                            ) : (
                              <span className="text-3xs text-gray-400 italic">Thiếu</span>
                            )}
                            {app.AnhCCCDMatSau && (
                              <img
                                src={app.AnhCCCDMatSau}
                                alt="Mặt sau"
                                onClick={() => setZoomedImage({ src: app.AnhCCCDMatSau!, title: `Mặt sau CCCD - ${app.HoTen}` })}
                                className="h-8 w-12 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 shadow-2xs"
                                title="Bấm để phóng to"
                              />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              app.TrangThai === 'APPROVED'
                                ? 'success'
                                : app.TrangThai === 'PENDING'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {app.TrangThai === 'APPROVED'
                              ? 'Đã duyệt'
                              : app.TrangThai === 'PENDING'
                              ? 'Chờ duyệt'
                              : 'Từ chối'}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-2xs text-gray-500 whitespace-nowrap">
                          {formatDate(app.NgayDangKy)}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="px-2 py-1 text-2xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
                          >
                            🔍 Xem chi tiết
                          </button>

                          {app.TrangThai === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveApplication(app)}
                                disabled={isProcessingApp}
                                className="px-2.5 py-1 text-2xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition cursor-pointer shadow-2xs"
                              >
                                ✅ Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingApp(app);
                                  setRejectReason('');
                                }}
                                disabled={isProcessingApp}
                                className="px-2 py-1 text-2xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition cursor-pointer"
                              >
                                ❌ Từ chối
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

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
                          <span className="text-gray-400">Cọc: {formatCurrency(c.depositAmount ?? 0)}</span>
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

      {/* ===================== MODAL: CHI TIẾT HỒ SƠ & SOI CCCD 2 MẶT ===================== */}
      <Modal
        isOpen={selectedApp !== null}
        onClose={() => setSelectedApp(null)}
        title={`Chi tiết Hồ sơ Đối tác Nông Dân: ${selectedApp?.HoTen || ''}`}
        size="xl"
      >
        {selectedApp && (
          <div className="space-y-4 text-xs">
            {/* Header summary pill */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍🌾</span>
                <div>
                  <h4 className="font-bold text-gray-900">{selectedApp.HoTen}</h4>
                  <span className="text-gray-500 font-mono text-2xs">Mã đơn: {selectedApp.MaDon} • Nộp ngày: {formatDate(selectedApp.NgayDangKy)}</span>
                </div>
              </div>
              <Badge
                variant={
                  selectedApp.TrangThai === 'APPROVED'
                    ? 'success'
                    : selectedApp.TrangThai === 'PENDING'
                    ? 'warning'
                    : 'danger'
                }
                size="md"
              >
                {selectedApp.TrangThai === 'APPROVED'
                  ? 'Đã duyệt'
                  : selectedApp.TrangThai === 'PENDING'
                  ? '🟡 Chờ thẩm định'
                  : 'Đã từ chối'}
              </Badge>
            </div>

            {/* Thông tin Căn Cước Công Dân */}
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-2xs flex items-center gap-1">
                <span>🪪</span> Thông tin định danh Căn Cước Công Dân (CCCD)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-2xs">
                <div>
                  <span className="text-gray-500 block">Số CCCD (12 số):</span>
                  <strong className="text-sm font-mono text-indigo-700">{selectedApp.SoCCCD}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Ngày cấp:</span>
                  <strong className="text-gray-800">{formatDate(selectedApp.NgayCap || undefined)}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Nơi cấp:</span>
                  <strong className="text-gray-800">{selectedApp.NoiCap || 'Cục Cảnh sát QLHC về TTXH'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Ngày sinh:</span>
                  <strong className="text-gray-800">{formatDate(selectedApp.NgaySinh || undefined)}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Giới tính:</span>
                  <strong className="text-gray-800">{selectedApp.GioiTinh || 'Nam'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Địa chỉ thường trú:</span>
                  <strong className="text-gray-800">{selectedApp.DiaChi}</strong>
                </div>
              </div>
            </div>

            {/* ── Khung Xem & Soi Ảnh CCCD 2 Mặt ── */}
            <div className="space-y-2">
              <h5 className="font-bold text-gray-800 uppercase tracking-wider text-2xs flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>📸</span> Ảnh chụp Căn cước công dân (Mặt trước &amp; Mặt sau)
                </span>
                <span className="text-3xs text-gray-500 font-normal">💡 Bấm vào ảnh để phóng to toàn màn hình</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ảnh Mặt trước */}
                <div className="p-2.5 rounded-xl border border-gray-200 bg-white space-y-1 text-center">
                  <span className="text-2xs font-semibold text-gray-700 block">Mặt trước CCCD</span>
                  {selectedApp.AnhCCCDMatTruoc ? (
                    <div
                      onClick={() => setZoomedImage({ src: selectedApp.AnhCCCDMatTruoc!, title: `Mặt trước CCCD - ${selectedApp.HoTen}` })}
                      className="relative h-44 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-zoom-in group shadow-xs"
                    >
                      <img
                        src={selectedApp.AnhCCCDMatTruoc}
                        alt="CCCD Mặt trước"
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-3xs px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                        🔍 Bấm phóng to
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-2xs">
                      Không có ảnh mặt trước
                    </div>
                  )}
                </div>

                {/* Ảnh Mặt sau */}
                <div className="p-2.5 rounded-xl border border-gray-200 bg-white space-y-1 text-center">
                  <span className="text-2xs font-semibold text-gray-700 block">Mặt sau CCCD</span>
                  {selectedApp.AnhCCCDMatSau ? (
                    <div
                      onClick={() => setZoomedImage({ src: selectedApp.AnhCCCDMatSau!, title: `Mặt sau CCCD - ${selectedApp.HoTen}` })}
                      className="relative h-44 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-zoom-in group shadow-xs"
                    >
                      <img
                        src={selectedApp.AnhCCCDMatSau}
                        alt="CCCD Mặt sau"
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-3xs px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                        🔍 Bấm phóng to
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-2xs">
                      Không có ảnh mặt sau
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin Tài khoản & Chuyên môn */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs">
              <div>
                <span className="text-gray-500 block">Điện thoại nhận SMS kích hoạt:</span>
                <strong className="text-emerald-800 font-mono text-xs">📱 {selectedApp.DienThoai}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Email:</span>
                <strong className="text-gray-800">{selectedApp.Email}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Tên đăng nhập đã đăng ký:</span>
                <strong className="font-mono text-gray-900">@{selectedApp.TenDangNhap}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Kinh nghiệm canh tác:</span>
                <strong className="text-gray-800">{selectedApp.KinhNghiem || 'Chưa ghi chú'}</strong>
              </div>
            </div>

            {/* Rejection reason if already rejected */}
            {selectedApp.LyDoTuChoi && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-2xs text-rose-800">
                <strong>Lý do từ chối:</strong> {selectedApp.LyDoTuChoi}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                Đóng
              </Button>

              {selectedApp.TrangThai === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRejectingApp(selectedApp);
                      setRejectReason('');
                    }}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    ❌ Từ chối hồ sơ
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 shadow-sm"
                    loading={isProcessingApp}
                    onClick={() => handleApproveApplication(selectedApp)}
                  >
                    ✅ Duyệt hồ sơ &amp; Bắn tin nhắn SMS kích hoạt
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== MODAL: TỪ CHỐI HỒ SƠ ===================== */}
      <Modal
        isOpen={rejectingApp !== null}
        onClose={() => setRejectingApp(null)}
        title={`Từ chối hồ sơ Nông Dân: ${rejectingApp?.HoTen || ''}`}
        description="Vui lòng nhập lý do từ chối để hệ thống gửi tin nhắn SMS phản hồi đến ứng viên."
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-2xs font-semibold text-gray-700 mb-1">
              Lý do từ chối hồ sơ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Ảnh CCCD bị mờ không nhìn rõ số định danh, vui lòng nộp lại..."
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:outline-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingApp(null)}
              disabled={isProcessingApp}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              loading={isProcessingApp}
              onClick={handleConfirmReject}
            >
              Xác nhận từ chối &amp; Gửi SMS
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================== MODAL: PHÓNG TO ẢNH CCCD (LIGHTBOX) ===================== */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl p-3 border border-white/20 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center text-white text-xs pb-2 border-b border-white/10 px-2">
              <span className="font-semibold">{zoomedImage.title}</span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="text-white/80 hover:text-white text-base px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2 max-h-[80vh] overflow-auto flex items-center justify-center">
              <img
                src={zoomedImage.src}
                alt="Phóng to CCCD"
                className="max-h-[75vh] w-auto rounded-lg shadow-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== WIDGET: MÔ PHỎNG GỬI TIN NHẮN SMS ĐIỆN THOẠI ===================== */}
      <SmsSimulatorModal
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
        smsData={smsData}
      />
    </div>
  );
}
