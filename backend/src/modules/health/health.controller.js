const { success } = require('../../utils/apiResponse');
const { testConnection } = require('../../config/database');

async function getHealth(req, res, next) {
  try {
    const dbStatus = await testConnection();

    return success(
      res,
      {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus.connected ? 'CONNECTED' : 'DISCONNECTED',
        dbDetails: dbStatus,
      },
      'Hệ thống đang hoạt động bình thường'
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHealth,
};
