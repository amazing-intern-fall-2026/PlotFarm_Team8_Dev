import * as vietqrService from './vietqrService.js';
import * as vnpayService from './vnpayService.js';
import * as momoService from './momoService.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Payment Strategy Factory
 * Lấy ra strategy tương ứng với phương thức thanh toán
 */
export const getPaymentStrategy = (method) => {
  const normalizedMethod = String(method || '').toUpperCase();
  switch (normalizedMethod) {
    case 'VIETQR':
      return {
        name: 'VIETQR',
        createPayment: vietqrService.createVietQrPayment,
        verifyWebhook: vietqrService.verifyVietQrWebhook,
      };
    case 'VNPAY':
      return {
        name: 'VNPAY',
        createPayment: vnpayService.createVNPayUrl,
        verifyIpn: vnpayService.verifyVNPayIpn,
      };
    case 'MOMO':
      return {
        name: 'MOMO',
        createPayment: momoService.createMoMoUrl,
        verifyIpn: momoService.verifyMoMoIpn,
      };
    default:
      throw new AppError(`Phương thức thanh toán "${method}" không được hỗ trợ.`, 400);
  }
};
