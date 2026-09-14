// src/services/emailService.js
import nodemailer from 'nodemailer';
import {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_APP_PASSWORD,
  MAIL_FROM_NAME,
  OTP_EXPIRES_MINUTES,
} from '../config/config.js';
import { AppError } from '../utils/AppError.js';

let transporter = null;

export const getTransporter = () => {
  if (!transporter) {
    if (!MAIL_USER || !MAIL_APP_PASSWORD) {
      return null;
    }
    transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: MAIL_SECURE,
      auth: {
        user: MAIL_USER,
        pass: MAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
};

/**
 * Gửi email chứa mã OTP đặt lại mật khẩu bằng Gmail SMTP
 * @param {string} toEmail - Email nhận mã
 * @param {string} otpCode - Mã OTP 6 chữ số
 * @param {string} username - Tên tài khoản
 * @param {number} expiresInMinutes - Thời hạn hiệu lực của OTP
 */
export const sendPasswordResetOtpEmail = async (
  toEmail,
  otpCode,
  username = '',
  expiresInMinutes = OTP_EXPIRES_MINUTES
) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    throw new AppError(
      'Hệ thống gửi email chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
      500
    );
  }

  const fromAddress = `"${MAIL_FROM_NAME}" <${MAIL_USER}>`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #059669; margin: 0; font-size: 26px; font-weight: bold;">PlotFarm</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Nền tảng số hóa nông nghiệp & quản lý thửa đất</p>
      </div>

      <div style="border-top: 2px solid #10b981; padding-top: 20px;">
        <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">Yêu cầu đặt lại mật khẩu</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          Xin chào ${username ? `<strong>${username}</strong>` : 'quý khách'},<br/>
          Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản PlotFarm liên kết với email này.
        </p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Dưới đây là mã xác thực OTP của bạn:</p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #ecfdf5; border: 2px dashed #059669; padding: 14px 32px; border-radius: 8px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #065f46;">
              ${otpCode}
            </span>
          </div>
        </div>

        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">
          * Mã này có hiệu lực trong ${expiresInMinutes} phút và chỉ được sử dụng một lần. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
        </p>

        <p style="color: #6b7280; font-size: 13px; margin-top: 24px; line-height: 1.5;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ quản trị viên để bảo vệ tài khoản.
        </p>
      </div>

      <div style="margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        © 2026 PlotFarm Portal. All rights reserved.
      </div>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[PlotFarm] Mã xác thực đặt lại mật khẩu: ${otpCode}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    // Phân loại lỗi SMTP và thông báo thân thiện, không làm lộ mật khẩu
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      throw new AppError('Không thể xác thực với máy chủ Gmail SMTP (sai tài khoản hoặc App Password)', 500);
    }
    if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      throw new AppError('Không thể kết nối đến máy chủ gửi email. Vui lòng thử lại sau.', 500);
    }
    throw new AppError(`Gửi email thất bại: ${error.message || 'Lỗi không xác định'}`, 500);
  }
};
