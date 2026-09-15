import { useState, useEffect } from "react";
import { updateProfile, changePassword, fetchCurrentUser } from "../auth/auth.api";
import { farmerService } from "./farmer.service";
import type { FarmerProfileData, FarmerPlotItem } from "./farmer.types";
import { Card, Alert, Button, Input, Modal } from "../../components/ui";
import {
  FarmerProfileHeader,
  FarmerProfileForm,
  FarmerAssignedFarmsList,
} from "./components";

export default function FarmerProfile() {
  const [profile, setProfile] = useState<FarmerProfileData>(() =>
    farmerService.getFarmerProfile(),
  );
  const [plots, setPlots] = useState<FarmerPlotItem[]>(() =>
    farmerService.getPlots(),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    async function loadFreshFarmer() {
      try {
        const user = await fetchCurrentUser();
        if (isMounted && user) {
          setProfile((prev) => ({
            ...prev,
            id: user.id ? String(user.id) : prev.id,
            username: user.username || prev.username,
            name: user.fullName || prev.name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
          }));
        }
      } catch (err) {
        console.warn("Could not fetch fresh farmer user from server:", err);
      }
    }
    loadFreshFarmer();

    function handleFarmerChange() {
      setProfile(farmerService.getFarmerProfile());
      setPlots(farmerService.getPlots());
      setIsEditing(false);
    }
    window.addEventListener("pf_farmer_changed", handleFarmerChange);
    return () => {
      isMounted = false;
      window.removeEventListener("pf_farmer_changed", handleFarmerChange);
    };
  }, []);

  async function handleSaveProfile(formData: {
    name: string;
    email: string;
    phone: string;
    bio: string;
  }) {
    setLoading(true);
    setErrorMessage("");
    try {
      const updatedUser = await updateProfile({
        fullName: formData.name,
        phone: formData.phone,
      });

      const updated = farmerService.updateFarmerProfile({
        name: updatedUser.fullName || formData.name,
        email: updatedUser.email || formData.email,
        phone: updatedUser.phone || formData.phone,
        bio: formData.bio,
      });

      setProfile(updated);
      setIsEditing(false);
      setSuccessMessage("Cập nhật thông tin hồ sơ Nông Dân thành công!");
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Lỗi khi lưu thông tin.");
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Hồ sơ Cá nhân Nông Dân (Farmer Profile)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thông tin liên hệ cá nhân, danh sách nông trại và số lượng thửa đất được Admin phân công.
          </p>
        </div>

        <div>
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

      {/* Main Profile Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary Component */}
        <FarmerProfileHeader
          profile={profile}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(true)}
        />

        {/* Right Column: 5 Core Required Fields & Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <span>Thông tin chi tiết Nông Dân</span>
              {isEditing ? (
                <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  Đang chỉnh sửa
                </span>
              ) : (
                <span className="text-2xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                  {profile.assignedFarms.length} Trang trại được giao
                </span>
              )}
            </h3>

            {isEditing ? (
              <FarmerProfileForm
                profile={profile}
                loading={loading}
                onSave={handleSaveProfile}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <FarmerAssignedFarmsList
                profile={profile}
                plots={plots}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Modal Đổi Mật Khẩu Nông Dân */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu tài khoản Nông Dân"
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
