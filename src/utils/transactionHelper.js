import sql from 'mssql';
import { getPool } from '../config/database.js';

/**
 * Hàm bọc (Wrapper) để chạy các thao tác DB an toàn trong một Transaction
 * Tự động Commit nếu thành công, Rollback nếu thất bại.
 * 
 * @param {Function} callback - Hàm chứa logic gọi DB, nhận tham số là `transaction`.
 * @returns Kết quả của callback
 */
export const runInTransaction = async (callback) => {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    
    // Thực thi logic được truyền vào, truyền kèm biến transaction để các query sử dụng
    const result = await callback(transaction);

    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('Transaction Error:', error);
    throw error;
  }
};
