const AppError = require('../utils/appError');
const { error: sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message);

  // 1. Operational AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // 2. Zod Validation Error
  if (err.name === 'ZodError') {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Dữ liệu yêu cầu không hợp lệ', 400, 'VALIDATION_ERROR', formatted);
  }

  // 3. MSSQL Specific Errors (Unique constraint / Concurrency Conflict)
  if (err.number === 2627 || err.number === 2601) {
    return sendError(res, 'Dữ liệu bị trùng lặp trong hệ thống', 409, 'DUPLICATE_RESOURCE');
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Token xác thực không hợp lệ', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token xác thực đã hết hạn', 401, 'TOKEN_EXPIRED');
  }

  // 5. Default Internal Server Error
  const message = env.NODE_ENV === 'production' ? 'Đã xảy ra lỗi máy chủ nội bộ' : err.message;
  return sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
}

module.exports = errorHandler;
