import crypto from 'crypto';
import {
  VIETQR_BANK_ID,
  VIETQR_ACCOUNT_NO,
  VIETQR_ACCOUNT_NAME,
  VIETQR_WEBHOOK_SECRET,
} from '../../config/config.js';

/**
 * VietQR Payment Strategy
 * Chuẩn tạo mã QR Napas 247 và xử lý Webhook biến động số dư (SePay / Casso / VietQR)
 */
export const createVietQrPayment = async ({ payment }) => {
  const amount = Number(payment.SoTien);
  const transferContent = payment.NoiDungCK;
  const qrCodeUrl = `https://img.vietqr.io/image/${VIETQR_BANK_ID}-${VIETQR_ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(VIETQR_ACCOUNT_NAME)}`;

  return {
    method: 'VIETQR',
    qrCodeUrl,
    bankAccount: VIETQR_ACCOUNT_NO,
    bankName: `Vietcombank (${VIETQR_BANK_ID})`,
    accountHolder: VIETQR_ACCOUNT_NAME,
    amount,
    transferContent,
    // Tương thích ngược với frontend bankInfo hiện tại
    bankInfo: {
      nganHang: 'TMCP Ngoai Thuong Viet Nam (Vietcombank)',
      soTaiKhoan: VIETQR_ACCOUNT_NO,
      chuTaiKhoan: VIETQR_ACCOUNT_NAME,
      soTien: amount,
      noiDungCK: transferContent,
      qrUrl: qrCodeUrl,
    },
  };
};

/**
 * Xác thực Webhook biến động số dư VietQR / SePay / Casso
 */
export const verifyVietQrWebhook = ({ payload, headers = {} }) => {
  // 1. Kiểm tra secret (API key hoặc HMAC signature) nếu có cấu hình
  const apiKey = headers['x-api-key'] || headers['authorization']?.replace(/^Apikey\s+/i, '');
  const signature = headers['x-webhook-signature'];

  if (signature) {
    const expectedSig = crypto
      .createHmac('sha256', VIETQR_WEBHOOK_SECRET)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { isValid: false, reason: 'Invalid VietQR webhook signature' };
    }
  } else if (apiKey && apiKey !== VIETQR_WEBHOOK_SECRET) {
    return { isValid: false, reason: 'Invalid VietQR API key' };
  }

  // 2. Parse nội dung chuyển khoản để lấy mã giao dịch (Payment ID hoặc Order ID)
  const content = payload.content || payload.noiDungCK || payload.description || '';
  const amount = Number(payload.transferAmount || payload.amount || payload.SoTien || 0);
  const transactionNo = String(payload.referenceCode || payload.id || payload.transactionNo || `VQR-${Date.now()}`);

  let paymentId = payload.paymentId || payload.orderId || payload.MaThanhToan || null;

  // Nếu không có paymentId trực tiếp, regex từ nội dung chuyển khoản (e.g., TT001 hoặc HD001 hoặc PF THUE OD001 KH001)
  if (!paymentId && content) {
    const matchTT = content.match(/\b(TT\d+)\b/i);
    if (matchTT) {
      paymentId = matchTT[1].toUpperCase();
    }
  }

  return {
    isValid: true,
    paymentId,
    content,
    receivedAmount: amount,
    transactionNo,
  };
};
