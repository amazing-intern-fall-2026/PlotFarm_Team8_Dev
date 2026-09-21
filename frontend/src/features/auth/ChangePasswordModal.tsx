import { useState } from "react";
import { changePassword } from "./auth.api";
import { Modal, Button, Input, Alert } from "../../components/ui";

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmailOrName?: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  userEmailOrName,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  function resetForm() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }
    if (oldPassword === newPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword({ oldPassword, newPassword });
      setSuccess(res.message || "Đổi mật khẩu thành công!");
      resetForm();
      setTimeout(() => {
        handleClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Đổi mật khẩu tài khoản"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {userEmailOrName && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-center gap-2">
            <span className="text-base">🔐</span>
            <span>
              Cập nhật mật khẩu cho tài khoản: <strong className="text-slate-800">{userEmailOrName}</strong>
            </span>
          </div>
        )}

        {error && (
          <Alert variant="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        <Input
          label="Mật khẩu hiện tại"
          type="password"
          placeholder="Nhập mật khẩu bạn đang sử dụng"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />

        <Input
          label="Mật khẩu mới"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          helperText="Mật khẩu cần tối thiểu 6 ký tự để đảm bảo an toàn."
          required
        />

        <Input
          label="Xác nhận mật khẩu mới"
          type="password"
          placeholder="Nhập lại chính xác mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={handleClose}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            fullWidth={false}
            loading={loading}
          >
            Lưu mật khẩu mới
          </Button>
        </div>
      </form>
    </Modal>
  );
}
