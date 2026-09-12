const app = require('./src/app');
const env = require('./src/config/env');
const { testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

async function startServer() {
  const server = app.listen(env.PORT, async () => {
    logger.info(`🚀 Backend API Server is running on port ${env.PORT}`);
    logger.info(`📍 Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`🔍 Health check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);

    // Check database connection status
    try {
      const dbStatus = await testConnection();
      if (dbStatus.connected) {
        logger.info('📦 Microsoft SQL Server connection established.');
      } else {
        logger.warn('⚠️ Microsoft SQL Server is currently not connected:', dbStatus.error);
        logger.warn('💡 Make sure SQL Server is running and check backend/.env settings.');
      }
    } catch (err) {
      logger.warn('⚠️ Database connection check encountered an error:', err.message);
    }
  });

  // Graceful shutdown handling
  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
