import { useState, type FormEvent } from "react";
import type { FarmerProfileData } from "../farmer.types";
import { Button, Input } from "../../../components/ui";

interface FarmerProfileFormProps {
  profile: FarmerProfileData;
  loading: boolean;
  onSave: (data: { name: string; email: string; phone: string; bio: string }) => void;
  onCancel: () => void;
}

export default function FarmerProfileForm({
  profile,
  loading,
  onSave,
  onCancel,
}: FarmerProfileFormProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [bio, setBio] = useState(profile.bio || "");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Họ và tên không được để trống";
    }
    if (!email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Định dạng email không hợp lệ";
    }
    if (!phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^\d{9,11}$/.test(phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Số điện thoại phải từ 9 đến 11 chữ số";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* 1. Name */}
      <Input
        label="Họ và tên (Name) *"
        value={name}
        error={errors.name}
        disabled={loading}
        onChange={(e) => {
          setName(e.target.value);
          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
        }}
      />

      {/* 2. Email */}
      <Input
        label="Địa chỉ Email (Email) *"
        type="email"
        value={email}
        error={errors.email}
        disabled={loading}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
      />

      {/* 3. Phone */}
      <Input
        label="Số điện thoại liên hệ (Phone) *"
        type="tel"
        value={phone}
        error={errors.phone}
        disabled={loading}
        onChange={(e) => {
          setPhone(e.target.value);
          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
        }}
      />

      {/* Bio / Experience */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Tiểu sử & Kinh nghiệm canh tác (Bio):
        </label>
        <textarea
          rows={3}
          value={bio}
          disabled={loading}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Mô tả kỹ năng chuyên sâu, loại cây thế mạnh, phương pháp canh tác..."
          className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={loading}
          onClick={onCancel}
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
          Lưu thông tin hồ sơ
        </Button>
      </div>
    </form>
  );
}
