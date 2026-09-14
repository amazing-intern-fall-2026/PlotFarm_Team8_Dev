import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, closeDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  console.log('🌱 Starting PlotFarm Database Seeding...');
  let pool = null;
  try {
    pool = await connectDatabase();
    
    const scriptsDir = path.resolve(__dirname, '../../database/scripts');
    const seedFiles = [
      '006_seed_sample_data.sql',
      '007_seed_full_ecosystem.sql',
    ];

    for (const file of seedFiles) {
      const filePath = path.join(scriptsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`📄 Executing ${file}...`);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        // Clean SQL commands if needed
        await pool.request().query(sqlContent);
        console.log(`✅ ${file} executed successfully.`);
      } else {
        console.warn(`⚠️ File not found: ${filePath}`);
      }
    }

    console.log('🎉 Full Ecosystem Seed Completed Successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

runSeed();
