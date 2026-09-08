import app from './app.js';
import { PORT } from './config/config.js';
import { connectDatabase, closeDatabase } from './config/database.js';

let httpServer;

const start = async () => {
  try {
    await connectDatabase();
    httpServer = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start server due to DB connection failure.');
    process.exit(1);
  }
};

start();

const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down...`);
  if (httpServer) {
    httpServer.close(async (err) => {
      if (err) console.error('Error closing HTTP server:', err);
      await closeDatabase();
      process.exit(err ? 1 : 0);
    });
  } else {
    await closeDatabase();
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

