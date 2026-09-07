import sql from 'mssql';
import { DB_CONFIG } from './config.js';

let pool = null;

export const connectDatabase = async () => {
  if (pool) return pool;
  try {
    pool = await sql.connect(DB_CONFIG);
    console.log(`✅ Connected to SQL Server ${DB_CONFIG.server}/${DB_CONFIG.database}`);
    return pool;
  } catch (err) {
    pool = null;
    console.error('❌ Failed to connect to SQL Server:', err.message);
    throw err;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected – call connectDatabase() first');
  }
  return pool;
};

export const closeDatabase = async () => {
  if (pool) {
    try {
      await pool.close();
      console.log('🔌 SQL connection pool closed');
    } catch (e) {
      console.warn('⚠️ Error closing pool:', e.message);
    } finally {
      pool = null;
    }
  }
};
