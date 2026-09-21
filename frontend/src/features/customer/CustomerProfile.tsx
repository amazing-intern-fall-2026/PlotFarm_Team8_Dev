import { useState, useEffect } from "react";
import { getCurrentUser, updateProfile, changePassword, fetchCurrentUser } from "../auth/auth.api";
import { customerService } from "./customer.service";
import type { SharedCustomerProfile, SharedPlotItem } from "./customer.types";
import { Card, Badge, Button, Input, Alert, Modal } from "../../components/ui";

interface CustomerProfileProps {
  onNavigatePlots?: () => void;
  onNavigateRequests?: () => void;
  onLogout?: () => void;
}

export default function CustomerProfile({
  onNavigatePlots,
  onNavigateRequests,
  onLogout,
}: CustomerProfileProps) {
  const authUser = getCurrentUser();
  const [profile, setProfile] = useState<SharedCustomerProfile>(() =>
    customerService.getActiveCustomerProfile()
  );
  const [myPlots, setMyPlots] = useState<SharedPlotItem[]>(() =>
    customerService.getMyPlots()
  );

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(authUser?.fullName || profile.name || "");
  const [phone, setPhone] = useState(authUser?.phone || profile.phone || "");
  const [shippingAddress, setShippingAddress] = useState(authUser?.shippingAddress || profile.shippingAddress || "");
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

  // IoT & Notification settings
  const [notifyDailyIoT, setNotifyDailyIoT] = useState(true);
  const [notifyHarvest, setNotifyHarvest] = useState(true);
  const [notifyCareResult, setNotifyCareResult] = useState(true);

  // Fetch real latest user profile from server on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFreshUser() {
      try {
        const user = await fetchCurrentUser();
        if (isMounted && user) {
          setFullName(user.fullName || "");
          setPhone(user.phone || "");
          setShippingAddress(user.shippingAddress || "");
          setProfile((prev) => ({
            ...prev,
            id: user.id ? String(user.id) : prev.id,
            username: user.username || prev.username,
            name: user.fullName || prev.name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            shippingAddress: user.shippingAddress || prev.shippingAddress,
          }));
        }
      } catch (err) {
        console.warn("Could not fetch fresh customer profile from server:", err);
      }
    }
    loadFreshUser();

    function handleSync() {
      const updated = customerService.getActiveCustomerProfile();
      setProfile(updated);
      setMyPlots(customerService.getMyPlots());
    }
    window.addEventListener("pf_data_changed", handleSync);
    window.addEventListener("pf_auth_changed", handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener("pf_data_changed", handleSync);
      window.removeEventListener("pf_auth_changed", handleSync);
    };
  }, []);

  function handleStartEdit() {
    setFullName(profile.name || "");
    setPhone(profile.phone || "");
    setShippingAddress(profile.shippingAddress || "");
    setErrorMessage("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setFullName(profile.name || "");
    setPhone(profile.phone || "");
    setShippingAddress(profile.shippingAddress || "");
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
      // 1. Call backend API to persist to SQL Server
      const updatedUser = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        shippingAddress: shippingAddress.trim(),
      });

      // 2. Update local state
      const newProfile: SharedCustomerProfile = {
        ...profile,
        name: updatedUser.fullName || fullName.trim(),
        phone: updatedUser.phone || phone.trim(),
        shippingAddress: updatedUser.shippingAddress || shippingAddress.trim(),
      };
      setProfile(newProfile);
      setIsEditing(false);
      setSuccessMessage("Cập nhật thông tin hồ sơ khách hàng thành công!");
      setTimeout(() => setSuccessMessage(""), 3500);

      // 3. Dispatch event to update layout and other components
      window.dispatchEvent(new CustomEvent("pf_data_changed", { detail: { action: "customer_profile_updated" } }));
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

  const careRequestsCount = customerService.getMyCareRequests().length;
  const harvestsCount = customerService.getMyHarvests().length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>👤</span>
            <span>Hồ sơ Cá nhân Khách Hàng (Customer Profile)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý thông tin liên hệ cá nhân, địa chỉ giao nhận nông sản khi thu hoạch và dịch vụ canh tác.
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
              className="flex items-center gap-2"
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
        {/* Left Column: Avatar & Summary */}
        <div className="space-y-6">
          <Card className="p-6 text-center flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-linear-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-3xl font-bold shadow-md ring-4 ring-emerald-50 mb-3">
              {profile.avatarIcon || (profile.name ? profile.name.slice(0, 2).toUpperCase() : "KH")}
            </div>

            <h3 className="font-bold text-gray-900 text-base">
              {profile.name || "Khách Hàng"}
            </h3>
            <p className="text-xs text-gray-500 mb-2">@{profile.username}</p>

            <Badge variant="success" className="mb-4">
              Khách Hàng Thành Viên
            </Badge>

            <div className="w-full border-t border-gray-100 pt-4 space-y-2.5 text-xs text-left">
              <div className="flex justify-between text-gray-600">
                <span>Mã khách hàng:</span>
                <strong className="text-gray-900 font-mono">{profile.id}</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Trạng thái tài khoản:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                  Đang hoạt động
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cổng giám sát:</span>
                <span className="text-gray-800">Cổng Khách Hàng</span>
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
                    <span>Đăng xuất tài khoản</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Service Statistics */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Dịch vụ nông trại của bạn
            </h4>
            <div className="space-y-2 text-xs">
              <div
                onClick={onNavigatePlots}
                className="p-2.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100/80 transition flex items-center justify-between cursor-pointer border border-emerald-200/60"
              >
                <div className="flex items-center gap-2">
                  <span>🌱</span>
                  <span className="font-medium text-emerald-950">Thửa đất đang thuê:</span>
                </div>
                <strong className="text-emerald-700 font-bold">{myPlots.length} thửa</strong>
              </div>

              <div
                onClick={onNavigateRequests}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between cursor-pointer border border-slate-200/60"
              >
                <div className="flex items-center gap-2">
                  <span>💬</span>
                  <span className="font-medium text-slate-700">Yêu cầu chăm sóc:</span>
                </div>
                <strong className="text-slate-800 font-bold">{careRequestsCount} yêu cầu</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/60 flex items-center justify-between border border-amber-200/60">
                <div className="flex items-center gap-2">
                  <span>🌾</span>
                  <span className="font-medium text-amber-950">Đợt thu hoạch:</span>
                </div>
                <strong className="text-amber-800 font-bold">{harvestsCount} đợt</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Detailed Contact & Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Thông Tin Cá Nhân & Địa Chỉ Giao Nhận
                </h3>
                <p className="text-2xs text-gray-500">
                  Dữ liệu dùng để ký hợp đồng điện tử và đóng gói giao nông sản tận nhà.
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
                    Họ và tên khách hàng <span className="text-red-500">*</span>
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
                      Số điện thoại nhận hàng
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tên đăng nhập (Tài khoản)
                    </label>
                    <Input
                      type="text"
                      value={profile.username}
                      disabled
                      className="bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Địa chỉ Email liên hệ
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <span className="text-2xs text-gray-400 mt-0.5 block">
                    * Email được dùng để định danh và nhận hợp đồng PDF, liên hệ Admin để đổi email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Địa chỉ nhận nông sản khi thu hoạch
                  </label>
                  <textarea
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-2xs text-gray-400 mt-0.5 block">
                    Đơn vị giao hàng sẽ tự động lấy địa chỉ này khi đợt thu hoạch sẵn sàng giao.
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
                    <strong className="text-gray-900 text-sm">{profile.name || "Chưa cập nhật"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xs text-gray-500 block">Số điện thoại nhận hàng:</span>
                    <strong className="text-gray-900 text-sm">{profile.phone || "Chưa cập nhật"}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xs text-gray-500 block">Tên đăng nhập:</span>
                    <strong className="text-gray-900 font-mono">{profile.username}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-2xs text-gray-500 block">Địa chỉ Email:</span>
                    <strong className="text-gray-900">{profile.email || "customer@plotfarm.com"}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl">
                  <span className="text-2xs text-emerald-800 font-semibold block mb-1">
                    📦 Địa chỉ nhận nông sản mặc định:
                  </span>
                  <p className="text-gray-900 text-xs font-medium">
                    {profile.shippingAddress || "Chưa thiết lập địa chỉ nhận hàng. Bấm \"Chỉnh sửa hồ sơ\" để cập nhật."}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Rented Plots Quick Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Thửa Đất & Nông Trại Đang Thuê ({myPlots.length})
                </h3>
                <p className="text-2xs text-gray-500">
                  Các thửa đất nông nghiệp bạn đang quản lý và theo dõi qua camera/IoT.
                </p>
              </div>
              {onNavigatePlots && (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onClick={onNavigatePlots}
                  className="text-xs"
                >
                  Xem chi tiết →
                </Button>
              )}
            </div>

            {myPlots.length === 0 ? (
              <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl text-xs">
                Bạn chưa có thửa đất thuê nào. Hãy khám phá nông trại và chọn thửa đất phù hợp.
              </div>
            ) : (
              <div className="space-y-3">
                {myPlots.map((plot) => (
                  <div
                    key={plot.id}
                    className="p-3 rounded-xl border border-gray-200 hover:border-emerald-300 bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                        🌱
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{plot.plotCode}</h4>
                        <p className="text-2xs text-gray-500">
                          {plot.farmName} • {plot.plantCrop}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-2xs text-gray-400 block">Kỹ sư phụ trách:</span>
                        <strong className="text-gray-700 text-2xs">{plot.farmerName}</strong>
                      </div>
                      <Badge variant="success">
                        Tiến độ: {plot.progress}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Preferences & Notifications */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Cài Đặt Nhận Thông Báo
            </h3>
            <p className="text-2xs text-gray-500 mb-4">
              Tùy chỉnh thông báo cập nhật về sinh trưởng cây trồng và các hoạt động canh tác.
            </p>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <div>
                  <strong className="text-gray-900 block">Thông báo chỉ số cảm biến IoT hàng ngày</strong>
                  <span className="text-2xs text-gray-500">Gửi tóm tắt độ ẩm đất, nhiệt độ và độ pH lúc 08:00 sáng.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDailyIoT}
                  onChange={(e) => setNotifyDailyIoT(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <div>
                  <strong className="text-gray-900 block">Thông báo lịch dự kiến thu hoạch nông sản</strong>
                  <span className="text-2xs text-gray-500">Báo trước 7 ngày khi trái cây, rau củ đến độ chín thu hoạch.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyHarvest}
                  onChange={(e) => setNotifyHarvest(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <div>
                  <strong className="text-gray-900 block">Kết quả xử lý yêu cầu chăm sóc từ Nông dân</strong>
                  <span className="text-2xs text-gray-500">Nhận thông báo kèm hình ảnh nghiệm thu khi kỹ sư hoàn thành việc.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCareResult}
                  onChange={(e) => setNotifyCareResult(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Đổi Mật Khẩu */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu tài khoản khách hàng"
        description="Nhập mật khẩu hiện tại và thiết lập mật khẩu mới an toàn cho tài khoản của bạn."
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
