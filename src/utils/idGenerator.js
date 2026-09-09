import crypto from 'crypto';

/**
 * Sinh mã định danh duy nhất (ID)
 * @param {string} prefix - Tiền tố (ví dụ: 'KH', 'NV', 'FARM')
 * @returns {string} - Trả về mã ID (VD: KH-123e4567)
 */
export const generateId = (prefix) => {
  // Lấy 8 ký tự đầu của UUID để làm mã cho ngắn gọn nhưng vẫn đảm bảo độ ngẫu nhiên cao
  const uuid = crypto.randomUUID().split('-')[0];
  return `${prefix}-${uuid}`;
};
