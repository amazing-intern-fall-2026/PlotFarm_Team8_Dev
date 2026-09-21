// src/services/farmerApplicationService.js
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { BCRYPT_SALT_ROUNDS } from '../config/config.js';
import * as appRepo from '../repositories/farmerApplicationRepository.js';
import * as authRepo from '../repositories/authRepository.js';

/** Submit a new farmer application with KYC CCCD info */
export const submitApplication = async (payload) => {
  const {
    fullName,
    birthDate,
    gender,
    email,
    phone,
    address,
    citizenId,
    issueDate,
    issuePlace,
    frontCardImage,
    backCardImage,
    username,
    password,
    experience,
  } = payload;

  // Basic validation
  if (!fullName || !email || !phone || !citizenId || !username || !password) {
    throw new AppError('Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, SĐT, CCCD, Username, Mật khẩu)', 400);
  }

  // Validate CCCD format (standard 12 digits or 9 digits)
  const cleanCCCD = citizenId.trim();
  if (!/^\d{9,12}$/.test(cleanCCCD)) {
    throw new AppError('Số Căn cước công dân không hợp lệ (phải gồm 9 hoặc 12 chữ số)', 400);
  }

  // Validate email format
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new AppError('Địa chỉ email không đúng định dạng', 400);
  }

  // Validate phone format (Vietnamese mobile 10 digits starting with 03, 05, 07, 08, 09)
  const cleanPhone = phone.trim();
  if (!/^(0[35789])[0-9]{8}$/.test(cleanPhone)) {
    throw new AppError('Số điện thoại không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09)', 400);
  }

  // Check if username already taken in TAIKHOAN
  const existingAccount = await authRepo.findAccountByUsername(username);
  if (existingAccount) {
    throw new AppError('Tên đăng nhập này đã được sử dụng trong hệ thống', 409);
  }

  // Check if username already in pending application
  const existingPendingApp = await appRepo.findApplicationByUsername(username);
  if (existingPendingApp) {
    throw new AppError('Tên đăng nhập này đã nộp hồ sơ và đang chờ ban quản trị xét duyệt', 409);
  }

  // Check if CCCD already in pending application
  const existingCCCDApp = await appRepo.findApplicationByCCCD(cleanCCCD);
  if (existingCCCDApp) {
    throw new AppError('Số Căn cước công dân này đã có hồ sơ đang chờ xét duyệt', 409);
  }

  // Check if email already used in system
  const [empWithEmail, custWithEmail, pendingWithEmail] = await Promise.all([
    authRepo.findEmployeeByEmail ? authRepo.findEmployeeByEmail(cleanEmail) : null,
    authRepo.findCustomerByEmail ? authRepo.findCustomerByEmail(cleanEmail) : null,
    appRepo.findApplicationByEmail ? appRepo.findApplicationByEmail(cleanEmail) : null,
  ]);
  if (empWithEmail || custWithEmail) {
    throw new AppError(`Email "${cleanEmail}" đã được sử dụng trong hệ thống PlotFarm. Vui lòng dùng email khác.`, 409);
  }
  if (pendingWithEmail) {
    throw new AppError(`Email "${cleanEmail}" đã có hồ sơ đăng ký đang chờ xét duyệt.`, 409);
  }

  // Check if phone already used in system
  const [empWithPhone, custWithPhone, pendingWithPhone] = await Promise.all([
    authRepo.findEmployeeByPhone ? authRepo.findEmployeeByPhone(cleanPhone) : null,
    authRepo.findCustomerByPhone ? authRepo.findCustomerByPhone(cleanPhone) : null,
    appRepo.findApplicationByPhone ? appRepo.findApplicationByPhone(cleanPhone) : null,
  ]);
  if (empWithPhone || custWithPhone) {
    throw new AppError(`Số điện thoại "${cleanPhone}" đã được sử dụng trong hệ thống PlotFarm.`, 409);
  }
  if (pendingWithPhone) {
    throw new AppError(`Số điện thoại "${cleanPhone}" đã có hồ sơ đăng ký đang chờ xét duyệt.`, 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Save to database
  const application = await appRepo.createApplication({
    fullName: fullName.trim(),
    birthDate,
    gender,
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    address: address ? address.trim() : '',
    citizenId: cleanCCCD,
    issueDate,
    issuePlace,
    frontCardImage,
    backCardImage,
    username: username.trim(),
    passwordHash,
    experience,
  });

  return {
    applicationId: application.MaDon,
    fullName: application.HoTen,
    phone: application.DienThoai,
    status: application.TrangThai,
    registeredAt: application.NgayDangKy,
    message: 'Nộp hồ sơ đối tác Nông Dân thành công! Ban quản trị sẽ thẩm định thông tin và gửi tin nhắn SMS thông báo tới số điện thoại của bạn.',
  };
};

/** Get applications list */
export const getApplications = async (status = 'ALL') => {
  return await appRepo.getAllApplications(status);
};

/** Get application details */
export const getApplicationById = async (id) => {
  const app = await appRepo.findApplicationById(id);
  if (!app) throw new AppError('Không tìm thấy hồ sơ đăng ký', 404);
  return app;
};

/** Approve farmer application & generate SMS simulation payload */
export const approveApplication = async (applicationId, adminUsername = 'admin') => {
  return runInTransaction(async (transaction) => {
    const app = await appRepo.findApplicationById(applicationId, transaction);
    if (!app) {
      throw new AppError('Không tìm thấy hồ sơ đăng ký', 404);
    }

    if (app.TrangThai !== 'PENDING') {
      throw new AppError(`Hồ sơ này đã được xử lý trước đó với trạng thái: ${app.TrangThai}`, 400);
    }

    // Check if account already exists
    const existingAccount = await authRepo.findAccountByUsername(app.TenDangNhap, transaction);
    if (existingAccount) {
      throw new AppError(`Tên đăng nhập "${app.TenDangNhap}" đã tồn tại trong hệ thống tài khoản chính thức`, 409);
    }

    // Pre-check if email already exists in NHANVIEN
    if (authRepo.findEmployeeByEmail) {
      const existingEmpEmail = await authRepo.findEmployeeByEmail(app.Email, transaction);
      if (existingEmpEmail) {
        throw new AppError(`Email "${app.Email}" đã được sử dụng bởi nhân viên ${existingEmpEmail.Ho} ${existingEmpEmail.Ten} (${existingEmpEmail.MaNV}). Không thể duyệt hồ sơ này khi email bị trùng lặp.`, 409);
      }
    }

    // Pre-check if phone already exists in NHANVIEN
    if (authRepo.findEmployeeByPhone) {
      const existingEmpPhone = await authRepo.findEmployeeByPhone(app.DienThoai, transaction);
      if (existingEmpPhone) {
        throw new AppError(`Số điện thoại "${app.DienThoai}" đã được sử dụng bởi nhân viên ${existingEmpPhone.Ho} ${existingEmpPhone.Ten} (${existingEmpPhone.MaNV}).`, 409);
      }
    }

    // 1. Create Employee in NHANVIEN
    const employeeId = await authRepo.createEmployee({
      fullName: app.HoTen,
      email: app.Email,
      phone: app.DienThoai,
      role: 'FARMER',
    }, transaction);

    // 2. Create Account in TAIKHOAN with role FARMER
    await authRepo.createAccountForEmployee({
      username: app.TenDangNhap,
      passwordHash: app.MatKhauHash,
      role: 'FARMER',
      maNV: employeeId,
    }, transaction);

    // 3. Mark application as APPROVED
    await appRepo.updateApplicationStatus(applicationId, {
      status: 'APPROVED',
      note: 'Hồ sơ đạt yêu cầu, đã kích hoạt tài khoản Nông dân đối tác',
      processedBy: adminUsername,
    }, transaction);

    // 4. Generate SMS notification payload
    const smsMessage = `[PlotFarm] Chúc mừng anh/chị ${app.HoTen}! Hồ sơ đối tác Nông Dân của bạn đã được duyệt thành công. Tài khoản: ${app.TenDangNhap} đã kích hoạt. Bạn có thể đăng nhập ngay tại plotfarm.vn.`;

    const smsNotification = {
      recipientPhone: app.DienThoai,
      recipientName: app.HoTen,
      citizenId: app.SoCCCD,
      username: app.TenDangNhap,
      employeeId,
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
      senderName: 'PlotFarm SMS',
      message: smsMessage,
    };

    return {
      applicationId,
      employeeId,
      username: app.TenDangNhap,
      status: 'APPROVED',
      smsNotification,
    };
  });
};

/** Reject farmer application & generate SMS simulation payload */
export const rejectApplication = async (applicationId, reason, adminUsername = 'admin') => {
  const app = await appRepo.findApplicationById(applicationId);
  if (!app) {
    throw new AppError('Không tìm thấy hồ sơ đăng ký', 404);
  }

  if (app.TrangThai !== 'PENDING') {
    throw new AppError(`Hồ sơ này đã được xử lý trước đó với trạng thái: ${app.TrangThai}`, 400);
  }

  const rejectReason = reason || 'Thông tin căn cước công dân hoặc hồ sơ chưa đáp ứng đủ tiêu chí tuyển chọn đợt này';

  await appRepo.updateApplicationStatus(applicationId, {
    status: 'REJECTED',
    note: rejectReason,
    processedBy: adminUsername,
  });

  const smsMessage = `[PlotFarm] Thông báo: Hồ sơ đối tác Nông Dân của anh/chị ${app.HoTen} chưa được phê duyệt. Lý do: ${rejectReason}. Mọi thắc mắc vui lòng liên hệ hotline PlotFarm 1900 6868.`;

  const smsNotification = {
    recipientPhone: app.DienThoai,
    recipientName: app.HoTen,
    citizenId: app.SoCCCD,
    username: app.TenDangNhap,
    status: 'DELIVERED',
    sentAt: new Date().toISOString(),
    senderName: 'PlotFarm SMS',
    message: smsMessage,
  };

  return {
    applicationId,
    status: 'REJECTED',
    reason: rejectReason,
    smsNotification,
  };
};
