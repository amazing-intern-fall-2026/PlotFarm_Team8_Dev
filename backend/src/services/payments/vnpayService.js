import crypto from 'crypto';
import {
  VNP_TMN_CODE,
  VNP_HASH_SECRET,
  VNP_URL,
  VNP_RETURN_URL,
} from '../../config/config.js';

/**
 * Format Date to VNPay format: yyyyMMddHHmmss (GMT+7)
 */
const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000); // GMT+7
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Sort object keys alphabetically (ASCII) per VNPay specifications
 */
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
    }
  }
  return sorted;
};

/**
 * Tạo redirect payment URL sang VNPay Sandbox
 */
export const createVNPayUrl = async ({ payment, ipAddr = '127.0.0.1' }) => {
  const now = new Date();
  const expire = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút

  const createDate = formatDate(now);
  const expireDate = formatDate(expire);
  const amount = Number(payment.SoTien);

  let vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: payment.MaThanhToan,
    vnp_OrderInfo: `Thanh toan don hang ${payment.MaThanhToan}`,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100, // VNPay bắt buộc nhân 100
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  vnpParams = sortObject(vnpParams);

  // Tạo signData query string
  const signData = Object.entries(vnpParams)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const paymentUrl = `${VNP_URL}?${signData}&vnp_SecureHash=${signed}`;

  return {
    method: 'VNPAY',
    paymentUrl,
    txnRef: payment.MaThanhToan,
    amount,
    expireDate,
  };
};

/**
 * Xác thực IPN Webhook hoặc Return URL từ VNPay
 */
export const verifyVNPayIpn = (params) => {
  const secureHash = params['vnp_SecureHash'];
  const vnpParams = { ...params };

  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sortedParams = sortObject(vnpParams);
  const signData = Object.entries(sortedParams)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (!secureHash || checkHash.toLowerCase() !== secureHash.toLowerCase()) {
    return {
      isValid: false,
      rspCode: '97',
      message: 'Invalid Checksum',
    };
  }

  const txnRef = params['vnp_TxnRef'];
  const amount = Number(params['vnp_Amount']) / 100;
  const responseCode = params['vnp_ResponseCode'];
  const transactionNo = params['vnp_TransactionNo'] || `VNP-${Date.now()}`;
  const bankCode = params['vnp_BankCode'];

  return {
    isValid: true,
    txnRef,
    amount,
    responseCode,
    transactionNo,
    bankCode,
  };
};
