import sql from 'mssql';

/**
 * Sinh mã tự tăng an toàn dựa trên tiền tố (prefix) và tên bảng.
 * Kế thừa logic của team để không phá vỡ cấu trúc.
 * Dùng UPDLOCK, HOLDLOCK để tránh trùng mã khi có nhiều request đồng thời.
 * 
 * @param {object} transactionOrPool - sql.Transaction hoặc sql.Pool
 * @param {string} tableName - Tên bảng (VD: 'KHACHHANG')
 * @param {string} columnName - Tên cột ID (VD: 'MaKH')
 * @param {string} prefix - Tiền tố (VD: 'KH')
 * @param {number} padLength - Độ dài số tự tăng (VD: 3 -> KH001)
 */
export const generateIncrementalId = async (transactionOrPool, tableName, columnName, prefix, padLength = 3) => {
  const request = new sql.Request(transactionOrPool);
  
  const result = await request.query(`
    SELECT TOP 1 ${columnName} FROM dbo.${tableName} WITH (UPDLOCK, HOLDLOCK)
    WHERE ${columnName} LIKE '${prefix}%'
    ORDER BY LEN(${columnName}) DESC, ${columnName} DESC
  `);

  let newId = `${prefix}${'1'.padStart(padLength, '0')}`;
  
  if (result.recordset.length > 0 && result.recordset[0][columnName]) {
    const lastId = result.recordset[0][columnName];
    const match = lastId.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      newId = `${prefix}${String(nextNum).padStart(match[1].length, '0')}`;
    } else {
      // Fallback
      newId = `${prefix}${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
  }

  return newId;
};
