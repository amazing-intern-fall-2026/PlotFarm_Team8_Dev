import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { Modal, Button, Input, Alert } from '../../components/ui';

interface FarmerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export default function FarmerRegisterModal({
  isOpen,
  onClose,
  onSuccess,
}: FarmerRegisterModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal & CCCD Info
    fullName: '',
    birthDate: '',
    gender: 'Nam',
    address: '',
    citizenId: '',
    issueDate: '',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH',

    // Step 2: CCCD Photos (Base64 data URLs)
    frontCardImage: '',
    backCardImage: '',

    // Step 3: Contact, Account & Specialty
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    experience: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    applicationId: string;
    fullName: string;
    phone: string;
  } | null>(null);

  // File input refs for Camera / Photo selection
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  }

  // Handle Photo upload or camera capture -> Base64 (with auto-compression to avoid payload size issues)
  function handleImageUpload(e: ChangeEvent<HTMLInputElement>, field: 'frontCardImage' | 'backCardImage') {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn hoặc chụp tệp định dạng hình ảnh (.jpg, .png, .jpeg)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 1280px maintaining aspect ratio
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG 0.82 quality -> sharp and small (~200KB)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          setFormData((prev) => ({ ...prev, [field]: compressedBase64 }));
          if (errorMsg) setErrorMsg('');
        } else {
          setFormData((prev) => ({ ...prev, [field]: event.target?.result as string }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function validateStep1(): boolean {
    if (!formData.fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên đầy đủ.');
      return false;
    }
    if (!formData.citizenId.trim()) {
      setErrorMsg('Vui lòng nhập số Căn cước công dân.');
      return false;
    }
    if (!/^\d{9,12}$/.test(formData.citizenId.trim())) {
      setErrorMsg('Số CCCD phải gồm 9 hoặc 12 chữ số theo quy định định danh.');
      return false;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ cư trú.');
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    if (!formData.frontCardImage) {
      setErrorMsg('Vui lòng chụp hoặc tải ảnh mặt trước Căn cước công dân.');
      return false;
    }
    if (!formData.backCardImage) {
      setErrorMsg('Vui lòng chụp hoặc tải ảnh mặt sau Căn cước công dân.');
      return false;
    }
    return true;
  }

  function validateStep3(): boolean {
    if (!formData.phone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại để nhận SMS thông báo.');
      return false;
    }
    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(formData.phone.trim())) {
      setErrorMsg('Số điện thoại không hợp lệ (cần 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return false;
    }
    if (!formData.username.trim() || formData.username.length < 4) {
      setErrorMsg('Tên đăng nhập phải có ít nhất 4 ký tự.');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return false;
    }
    return true;
  }

  function handleNext() {
    setErrorMsg('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/v1/auth/farmer-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          birthDate: formData.birthDate || null,
          gender: formData.gender,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          citizenId: formData.citizenId,
          issueDate: formData.issueDate || null,
          issuePlace: formData.issuePlace || 'Cục Cảnh sát QLHC về TTXH',
          frontCardImage: formData.frontCardImage,
          backCardImage: formData.backCardImage,
          username: formData.username,
          password: formData.password,
          experience: formData.experience,
        }),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Không thể gửi đơn đăng ký');
      }

      setSubmittedData({
        applicationId: res.data?.applicationId || 'DKND-OK',
        fullName: formData.fullName,
        phone: formData.phone,
      });
      setStep(4);
      if (onSuccess) onSuccess(res.data);
    } catch (err: any) {
      console.error('Farmer registration error:', err);
      setErrorMsg(err.message || 'Lỗi khi gửi hồ sơ đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetAndClose() {
    setStep(1);
    setFormData({
      fullName: '',
      birthDate: '',
      gender: 'Nam',
      address: '',
      citizenId: '',
      issueDate: '',
      issuePlace: 'Cục Cảnh sát QLHC về TTXH',
      frontCardImage: '',
      backCardImage: '',
      phone: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      experience: '',
    });
    setErrorMsg('');
    setSubmittedData(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Đăng Ký Trở Thành Đối Tác Nông Dân PlotFarm"
      size="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Step Indicator Header (Steps 1-3) */}
        {step < 4 && (
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-2xs ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                1
              </span>
              <span>Thông tin cá nhân &amp; CCCD</span>
            </div>
            <span className="text-gray-300">➔</span>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-2xs ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                2
              </span>
              <span>Chụp ảnh CCCD 2 mặt</span>
            </div>
            <span className="text-gray-300">➔</span>
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-2xs ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                3
              </span>
              <span>Tài khoản &amp; Liên hệ</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <Alert variant="error" title="Lỗi thông tin">
            {errorMsg}
          </Alert>
        )}

        {/* ── BƯỚC 1: Thông tin cá nhân & Số CCCD ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 text-2xs">
              <strong className="block font-bold mb-0.5">🌿 Quy trình tiếp nhận đối tác:</strong>
              Hồ sơ đăng ký sẽ được Quản trị viên thẩm định dựa trên Căn cước công dân và chuyên môn canh tác. Khi được duyệt, hệ thống sẽ gửi tin nhắn SMS kích hoạt về số điện thoại của bạn.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Họ và tên đầy đủ <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ví dụ: Nguyễn Văn Nông"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Số Căn cước công dân (CCCD) <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="12 chữ số định danh cá nhân"
                  value={formData.citizenId}
                  maxLength={12}
                  onChange={(e) => handleChange('citizenId', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-1.5 px-3 text-xs bg-white text-gray-800 focus:outline-emerald-500"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Ngày cấp CCCD
                </label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleChange('issueDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Nơi cấp CCCD
                </label>
                <Input
                  placeholder="Cục Cảnh sát QLHC về TTXH"
                  value={formData.issuePlace}
                  onChange={(e) => handleChange('issuePlace', e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Địa chỉ thường trú / tạm trú <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={handleNext}
              >
                Tiếp tục: Chụp ảnh CCCD ➔
              </Button>
            </div>
          </div>
        )}

        {/* ── BƯỚC 2: Chụp hoặc Tải ảnh CCCD 2 mặt ───────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 text-2xs">
              <strong>📸 Hướng dẫn chụp ảnh CCCD:</strong>
              <p className="mt-0.5 text-blue-800">
                Chụp rõ nét 2 mặt Căn cước công dân, không bị lóa sáng, không bị mất góc và rõ số định danh để Admin đối chiếu thông tin. Hỗ trợ bấm chụp trực tiếp bằng camera hoặc chọn ảnh có sẵn từ máy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mặt trước CCCD */}
              <div className="p-3.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center space-y-2 relative">
                <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                  <span>🪪</span> Mặt trước CCCD <span className="text-red-500">*</span>
                </span>

                {formData.frontCardImage ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-emerald-300 shadow-xs group">
                    <img
                      src={formData.frontCardImage}
                      alt="CCCD Mặt trước"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => frontInputRef.current?.click()}
                        className="bg-white text-gray-900 px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer shadow-xs hover:bg-gray-100"
                      >
                        📷 Chụp / Đổi ảnh khác
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className="w-full h-36 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition p-3 space-y-1"
                  >
                    <span className="text-3xl">📷</span>
                    <span className="font-semibold text-emerald-800 text-2xs">
                      Bấm để Chụp ảnh hoặc Chọn tệp
                    </span>
                    <span className="text-3xs text-gray-500">Mặt trước có ảnh chân dung và số định danh</span>
                  </div>
                )}

                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'frontCardImage')}
                />
              </div>

              {/* Mặt sau CCCD */}
              <div className="p-3.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center space-y-2 relative">
                <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                  <span>🪪</span> Mặt sau CCCD <span className="text-red-500">*</span>
                </span>

                {formData.backCardImage ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-emerald-300 shadow-xs group">
                    <img
                      src={formData.backCardImage}
                      alt="CCCD Mặt sau"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => backInputRef.current?.click()}
                        className="bg-white text-gray-900 px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer shadow-xs hover:bg-gray-100"
                      >
                        📷 Chụp / Đổi ảnh khác
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => backInputRef.current?.click()}
                    className="w-full h-36 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition p-3 space-y-1"
                  >
                    <span className="text-3xl">📷</span>
                    <span className="font-semibold text-emerald-800 text-2xs">
                      Bấm để Chụp ảnh hoặc Chọn tệp
                    </span>
                    <span className="text-3xs text-gray-500">Mặt sau có chip điện tử và đặc điểm nhận dạng</span>
                  </div>
                )}

                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'backCardImage')}
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                ⬅ Quay lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={handleNext}
              >
                Tiếp tục: Tạo tài khoản ➔
              </Button>
            </div>
          </div>
        )}

        {/* ── BƯỚC 3: Tài khoản & Chuyên môn ─────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-2xs">
              📱 <strong>Số điện thoại nhận tin nhắn:</strong> Hãy nhập chính xác số điện thoại đang hoạt động. Khi hồ sơ được Admin duyệt thành công, hệ thống sẽ gửi tin nhắn SMS thông báo tới số này.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Số điện thoại nhận SMS <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="0901234567"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Email liên hệ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="farmer@plotfarm.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Tên đăng nhập mong muốn <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="farmer_nguyenvan"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Kinh nghiệm / Chuyên môn làm vườn
                </label>
                <Input
                  placeholder="VD: 5 năm trồng rau hữu cơ, IoT nông nghiệp"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Mật khẩu đăng nhập <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-gray-700 mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
              >
                ⬅ Quay lại
              </Button>

              <Button
                variant="primary"
                size="sm"
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4"
                loading={isSubmitting}
              >
                Gửi Hồ Sơ Xét Duyệt Nông Dân ➔
              </Button>
            </div>
          </form>
        )}

        {/* ── BƯỚC 4: Hoàn tất & Chờ duyệt ────────────────────────────── */}
        {step === 4 && submittedData && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl shadow-inner">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                Nộp Hồ Sơ Đăng Ký Thành Công!
              </h3>
              <p className="text-xs text-gray-600">
                Cảm ơn anh/chị <strong>{submittedData.fullName}</strong> đã đăng ký trở thành đối tác canh tác tại PlotFarm.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-2 text-2xs text-gray-700">
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="text-gray-500">Mã hồ sơ:</span>
                <span className="font-mono font-bold text-emerald-700">{submittedData.applicationId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="text-gray-500">Số điện thoại nhận SMS:</span>
                <span className="font-mono font-bold text-gray-900">{submittedData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái hồ sơ:</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  🟡 Đang chờ Ban quản trị xét duyệt (PENDING)
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl max-w-md mx-auto text-2xs text-blue-800 text-left flex items-start gap-2">
              <span className="text-sm">📲</span>
              <span>
                Ban quản trị sẽ kiểm tra thông tin CCCD và liên hệ hoặc <strong>gửi tin nhắn SMS kích hoạt</strong> về số điện thoại <strong>{submittedData.phone}</strong> ngay khi hồ sơ được phê duyệt!
              </span>
            </div>

            <div className="pt-3">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
                onClick={handleResetAndClose}
              >
                Đã hiểu &amp; Quay lại Đăng nhập
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
