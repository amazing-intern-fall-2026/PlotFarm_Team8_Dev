import * as dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3001";

// Helper to convert env strings to boolean safely
const toBoolean = (value) => {
  return value?.toLowerCase() === "true";
};

// Validate required DB environment variables (do not log passwords)
if (process.env.NODE_ENV !== 'test') {
  const requiredVars = ["DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
}


// Process optional DB_PORT and support named instances
const serverEnv = process.env.DB_SERVER;
const portEnv = process.env.DB_PORT;
let port; // undefined by default
if (portEnv) {
  const portNum = Number(portEnv);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }
  // Only set port if server does NOT contain a named instance
  if (!serverEnv.includes('\\')) {
    port = portNum;
  }
}

export const DB_CONFIG = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: serverEnv,
  database: process.env.DB_NAME,
  ...(port !== undefined ? { port } : {}),
  requestTimeout: 15000,
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: toBoolean(process.env.DB_ENCRYPT),
    trustServerCertificate: toBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE),
  },
};

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'plotfarm_jwt_secret_key_default_2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

// Email SMTP configuration (Nodemailer / Gmail SMTP)
export const MAIL_HOST = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
export const MAIL_PORT = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10);
export const MAIL_SECURE = toBoolean(process.env.MAIL_SECURE || process.env.SMTP_SECURE || 'false');
export const MAIL_USER = process.env.MAIL_USER || process.env.SMTP_USER || '';
export const MAIL_APP_PASSWORD = process.env.MAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
export const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'PlotFarm';
export const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '5', 10);

// VietQR Configuration
export const VIETQR_BANK_ID = process.env.VIETQR_BANK_ID || '970436';
export const VIETQR_ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || '0071000998877';
export const VIETQR_ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || 'CONG TY CP NONG NGHIEP SO PLOTFARM';
export const VIETQR_WEBHOOK_SECRET = process.env.VIETQR_WEBHOOK_SECRET || 'plotfarm_vietqr_secret_2026';

// VNPay Configuration
export const VNP_TMN_CODE = process.env.VNP_TMN_CODE || 'PLOTFARM01';
export const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || 'RAZYUBZCOMMQJLHUSIAGZJDTRWXZCHUC';
export const VNP_URL = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
export const VNP_RETURN_URL = process.env.VNP_RETURN_URL || `${CLIENT_URL}/payment-return`;
export const VNP_IPN_URL = process.env.VNP_IPN_URL || `http://localhost:${PORT}/api/v1/payments/vnpay-ipn`;

// MoMo Configuration
export const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO_PLOTFARM';
export const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY';
export const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY';
export const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
export const MOMO_REDIRECT_URL = process.env.MOMO_REDIRECT_URL || `${CLIENT_URL}/payment-return`;
export const MOMO_IPN_URL = process.env.MOMO_IPN_URL || `http://localhost:${PORT}/api/v1/payments/momo-ipn`;


