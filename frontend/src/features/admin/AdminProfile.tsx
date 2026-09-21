import { useState, useEffect } from "react";
import { getCurrentUser, updateProfile, changePassword, fetchCurrentUser } from "../auth/auth.api";
import { adminService } from "./admin.service";
import type { AdminKPIData } from "./admin.types";
import { Card, Badge, Button, Input, Alert, Modal } from "../../components/ui";

interface AdminProfileProps {
  onNavigateUsers?: () => void;
  onNavigateFarms?: () => void;
  onLogout?: () => void;
}

export default function AdminProfile({
  onNavigateUsers,
  onNavigateFarms,
  onLogout,
}: AdminProfileProps) {
  const authUser = getCurrentUser();
  const [kpi, setKpi] = useState<AdminKPIData | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(authUser?.fullName || "Trần Quản Trị");
  const [phone, setPhone] = useState(authUser?.phone || "0909999999");
  const [email, setEmail] = useState(authUser?.email || "admin@plotfarm.com");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadFreshAdmin() {
      try {
        const user = await fetchCurrentUser();
        if (isMounted && user) {
          setFullName(user.fullName || "Trần Quản Trị");
          setPhone(user.phone || "");
          setEmail(user.email || "admin@plotfarm.com");
        }
      } catch (err) {
        console.warn("Failed to fetch fresh admin profile:", err);
      }
    }
    loadFreshAdmin();

    adminService
      .fetchKPI()
      .then((data) => {
        if (isMounted) setKpi(data);
      })
      .catch((err) => console.warn("Failed to fetch admin KPI for profile:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  function handleStartEdit() {
    setFullName(authUser?.fullName || fullName || "Trần Quản Trị");
    setPhone(authUser?.phone || phone || "0909999999");
    setEmail(authUser?.email || email || "admin@plotfarm.com");
    setErrorMessage("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setErrorMessage("");
    setIsEditing(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage("Họ và tên không được để trống.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedUser = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      setFullName(updatedUser.fullName || fullName.trim());
      setPhone(updatedUser.phone || phone.trim());
      setIsEditing(false);
      setSuccessMessage("Cập nhật thông tin hồ sơ Quản trị viên thành công!");
      setTimeout(() => setSuccessMessage(""), 3500);

      window.dispatchEvent(new CustomEvent("pf_admin_profile_changed"));
    } catch (err: any) {
      setErrorMessage(err?.message || "Lỗi khi lưu thông tin.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({ oldPassword, newPassword });
      setPasswordSuccess(res.message || "Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess("");
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  const totalPlots = kpi?.totalPlots ?? kpi?.tongSoPlot ?? 0;
  const rentedPlots = kpi?.rentedPlots ?? kpi?.plotDangThue ?? 0;
  const totalFarms = kpi?.totalFarms ?? kpi?.tongSoFarm ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🛡️</span>
            <span>Hồ sơ Quản Trị Viên Hệ Thống (Administrator Profile)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý tài khoản quản trị cấp cao, thẩm quyền điều hành và giám sát kỹ thuật nền tảng PlotFarm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => {
              setIsPasswordModalOpen(true);
              setPasswordError("");
              setPasswordSuccess("");
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            className="flex items-center gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
          >
            <span>🔑</span>
            <span>Đổi mật khẩu</span>
          </Button>

          {!isEditing && (
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleStartEdit}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <span>✏️</span>
              <span>Chỉnh sửa hồ sơ</span>
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* Main Grid: Left summary card & Right detailed card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & System Tech Info */}
        <div className="space-y-6">
          <Card className="p-6 text-center flex flex-col items-center border-t-4 border-indigo-600">
            <div className="h-20 w-20 rounded-full bg-linear-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center text-2xl font-black shadow-md ring-4 ring-indigo-50 mb-3 tracking-wider">
              AD
            </div>

            <h3 className="font-bold text-gray-900 text-base">
              {fullName}
            </h3>
            <p className="text-xs text-gray-500 mb-2">@{authUser?.username || "admin"}</p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 mb-4">
              <span>👑</span> Quản Trị Viên Cấp Cao
            </span>

            <div className="w-full border-t border-gray-100 pt-4 space-y-2.5 text-xs text-left">
              <div className="flex justify-between text-gray-600">
                <span>Mã định danh:</span>
                <strong className="text-gray-900 font-mono">{authUser?.id || "NV010"}</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Vai trò bảo mật:</span>
                <span className="text-indigo-700 font-bold">ADMIN (Root)</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Trạng thái:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                  Toàn quyền truy cập
                </span>
              </div>

              {onLogout && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth={true}
                    onClick={onLogout}
                    className="text-red-600 hover:bg-red-50 hover:border-red-300 border-gray-200 text-xs flex items-center justify-center gap-2"
                  >
                    <span>🚪</span>
                    <span>Đăng xuất Quản trị viên</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* System Environment */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>🖥️</span> Môi trường vận hành
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <span className="text-gray-600">Cơ sở dữ liệu:</span>
                <strong className="text-gray-900 font-mono text-2xs">MS SQL Server</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <span className="text-gray-600">Giao thức API:</span>
                <strong className="text-gray-900 font-mono text-2xs">RESTful v1 (Express)</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <span className="text-gray-600">Xác thực:</span>
                <strong className="text-emerald-700 font-mono text-2xs">JWT HMAC-SHA256</strong>
              </div>
            </div>
          </Card>

          {/* Quick Metrics */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📊</span> Phạm vi điều hành
            </h4>
            <div className="space-y-2 text-xs">
              <div
                onClick={onNavigateFarms}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition cursor-pointer flex items-center justify-between border border-slate-200/70"
              >
                <span className="text-gray-700">Nông trại quản lý:</span>
                <strong className="text-indigo-600 font-bold">{totalFarms} nông trại</strong>
              </div>
              <div
                onClick={onNavigateFarms}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition cursor-pointer flex items-center justify-between border border-slate-200/70"
              >
                <span className="text-gray-700">Tổng số thửa đất:</span>
                <strong className="text-indigo-600 font-bold">{totalPlots} thửa</strong>
              </div>
              <div
                onClick={onNavigateUsers}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition cursor-pointer flex items-center justify-between border border-slate-200/70"
              >
                <span className="text-gray-700">Thửa đang cho thuê:</span>
                <strong className="text-emerald-700 font-bold">{rentedPlots} thửa</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Profile Info, Form & Privileges */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Thông Tin Cá Nhân & Quyền Quản Trị
                </h3>
                <p className="text-2xs text-gray-500">
                  Thông tin phục vụ liên lạc nội bộ và nhật ký kiểm toán hệ thống (Audit Trail).
                </p>
              </div>

              {isEditing && (
                <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Đang chỉnh sửa
                </span>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Họ và tên Quản trị viên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Số điện thoại trực ban
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0909999999"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tên đăng nhập hệ thống
                    </label>
                    <Input
                      type="text"
                      value={authUser?.username || "admin"}
                      disabled
                      className="bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Địa chỉ Email quản trị
                  </label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <span className="text-2xs text-gray-400 mt-0.5 block">
                    * Email quản trị nhận các cảnh báo bảo mật hệ thống và thông báo kiểm toán.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xs text-gray-500 block">Họ và tên:</span>
                    <strong className="text-gray-900 text-sm">{fullName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xs text-gray-500 block">Số điện thoại:</span>
                    <strong className="text-gray-900 text-sm">{phone}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xs text-gray-500 block">Tên đăng nhập:</span>
                    <strong className="text-gray-900 font-mono">{authUser?.username || "admin"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xs text-gray-500 block">Địa chỉ Email:</span>
                    <strong className="text-gray-900">{email}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/70 rounded-xl">
                  <span className="text-2xs text-indigo-800 font-semibold block mb-1">
                    🔒 Cấp độ quyền hạn tài khoản:
                  </span>
                  <p className="text-gray-900 text-xs font-medium">
                    Tài khoản có toàn quyền quản trị (Super Admin), được phép truy cập tất cả các module quản lý nông trại, hợp đồng, tài khoản người dùng và thiết bị IoT.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Admin Privileges Card */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Chi Tiết Phân Quyền Vận Hành (Permissions)
            </h3>
            <p className="text-2xs text-gray-500 mb-4">
              Danh mục các quyền hạn thực thi trực tiếp trên hệ thống cơ sở dữ liệu PlotFarm.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏡</span>
                  <div>
                    <strong className="text-gray-900 block">Quản lý Nông trại & Thửa đất</strong>
                    <span className="text-2xs text-gray-500">Phê duyệt nông trại đối tác, cấu hình thửa đất, thiết lập cảm biến IoT.</span>
                  </div>
                </div>
                <Badge variant="success">Toàn quyền</Badge>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📜</span>
                  <div>
                    <strong className="text-gray-900 block">Kiểm soát Hợp đồng & Doanh thu</strong>
                    <span className="text-2xs text-gray-500">Xem hợp đồng thuê đất, cập nhật trạng thái, kiểm tra thanh toán.</span>
                  </div>
                </div>
                <Badge variant="success">Toàn quyền</Badge>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">👥</span>
                  <div>
                    <strong className="text-gray-900 block">Quản lý Người dùng & Nhân sự</strong>
                    <span className="text-2xs text-gray-500">Đăng ký tài khoản nhân viên nông trại, khóa/kích hoạt tài khoản người dùng.</span>
                  </div>
                </div>
                <Badge variant="success">Toàn quyền</Badge>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌾</span>
                  <div>
                    <strong className="text-gray-900 block">Giám sát Thu hoạch & Vận chuyển</strong>
                    <span className="text-2xs text-gray-500">Theo dõi tiến độ giao hàng, đóng gói và đơn vị vận chuyển.</span>
                  </div>
                </div>
                <Badge variant="success">Toàn quyền</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Đổi Mật Khẩu Admin */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu Quản trị viên"
        description="Nhập mật khẩu hiện tại và thiết lập mật khẩu mới an toàn cho tài khoản quản trị hệ thống."
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
          {passwordSuccess && (
            <Alert variant="success">{passwordSuccess}</Alert>
          )}
          {passwordError && (
            <Alert variant="error">{passwordError}</Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isChangingPassword}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              fullWidth={false}
              disabled={isChangingPassword}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
