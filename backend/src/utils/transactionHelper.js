import sql from 'mssql';
import { getPool } from '../config/database.js';

/**
 * Chạy logic bọc trong một Transaction an toàn
 * Tự động commit nếu callback thành công, tự động rollback nếu có lỗi.
 */
export const runInTransaction = async (callback, isolationLevel) => {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);

  try {
    if (isolationLevel) {
      await transaction.begin(isolationLevel);
    } else {
      await transaction.begin();
    }
    
    // Truyền transaction vào callback để các câu query dùng chung
    const result = await callback(transaction);

    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      // Bỏ qua lỗi rollback nếu transaction đã chết hoặc chưa begin
    }
    throw error;
  }
};
