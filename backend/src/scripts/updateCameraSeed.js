import dotenv from 'dotenv';
dotenv.config();
import { getPool, connectDatabase } from '../config/database.js';

const updateCameras = async () => {
  try {
    await connectDatabase();
    const pool = getPool();
    const updates = [
      { id: 'OD001', url: 'https://assets.mixkit.co/videos/preview/mixkit-vegetables-in-a-greenhouse-40080-large.mp4' },
      { id: 'OD002', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1' },
      { id: 'OD003', url: 'https://assets.mixkit.co/videos/preview/mixkit-watering-plants-in-a-greenhouse-40081-large.mp4' },
      { id: 'OD004', url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa97?w=1200&auto=format&fit=crop&q=80' },
      { id: 'OD005', url: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-fresh-tomatoes-on-a-vine-40083-large.mp4' },
      { id: 'OD006', url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200&auto=format&fit=crop&q=80' },
      { id: 'OD007', url: 'https://assets.mixkit.co/videos/preview/mixkit-tractor-working-in-a-field-40082-large.mp4' },
      { id: 'OD008', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80' },
      { id: 'OD009', url: 'https://assets.mixkit.co/videos/preview/mixkit-vegetables-in-a-greenhouse-40080-large.mp4' },
    ];

    for (const item of updates) {
      await pool.request()
        .input('id', item.id)
        .input('url', item.url)
        .query('UPDATE dbo.ODAT SET CameraUrl = @url, UpdatedAt = SYSUTCDATETIME() WHERE MaODat = @id');
    }

    console.log('✅ Updated all camera seed URLs in database successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating camera URLs:', err);
    process.exit(1);
  }
};

updateCameras();
