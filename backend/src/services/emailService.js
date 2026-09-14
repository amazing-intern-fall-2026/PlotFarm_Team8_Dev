// src/services/emailService.js
import nodemailer from 'nodemailer';
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
  NODE_ENV,
} from '../config/config.js';

let transporter = null;

const getTransporter = () => {
  if (!transporter && SMTP_HOST && SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send Password Reset OTP Email
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} username - User account name
 * @returns {Promise<{success: boolean, mocked: boolean}>}
 */
export const sendPasswordResetOtpEmail = async (toEmail, otpCode, username = '') => {
  const mailTransporter = getTransporter();

  // HTML email template
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 12px; background-color: #ffffff;">
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

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          Dưới đây là mã xác thực OTP của bạn:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #ecfdf5; border: 2px dashed #059669; padding: 14px 32px; border-radius: 8px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #065f46;">
              ${otpCode}
            </span>
          </div>
        </div>

        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">
          * Mã này có hiệu lực trong 15 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
        </p>

        <p style="color: #6b7280; font-size: 13px; margin-top: 24px; line-height: 1.5;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với bộ phận hỗ trợ quản trị viên để bảo vệ tài khoản của bạn.
        </p>
      </div>

      <div style="margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        © 2026 PlotFarm Portal. All rights reserved.
      </div>
    </div>
  `;

  if (!mailTransporter) {
    // Development / Test fallback logging
    console.log('\n==================================================');
    console.log('📢 [PlotFarm EMAIL SERVICE - DEV/FALLBACK MODE]');
    console.log(`To: ${toEmail}`);
    console.log(`Username: ${username}`);
    console.log(`Mã OTP: [ ${otpCode} ] (Hạn 15 phút)`);
    console.log('==================================================\n');
    return { success: true, mocked: true };
  }

  try {
    await mailTransporter.sendMail({
      from: EMAIL_FROM,
      to: toEmail,
      subject: `[PlotFarm] Mã xác thực đặt lại mật khẩu: ${otpCode}`,
      html: htmlContent,
    });
    return { success: true, mocked: false };
  } catch (error) {
    console.error('Lỗi khi gửi email qua SMTP:', error);
    // In dev mode, don't crash if SMTP fails, fallback to console log
    if (NODE_ENV !== 'production') {
      console.log(`[FALLBACK] Mã OTP cho ${toEmail}: ${otpCode}`);
      return { success: true, mocked: true, warning: 'SMTP failed, OTP logged to console' };
    }
    throw error;
  }
};
