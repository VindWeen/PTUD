const auditService = require('./audit.service');
const { success } = require('../../utils/apiResponse');
const AppError = require('../../utils/appError');

async function getLogs(req, res, next) {
  try {
    const result = await auditService.getLogs(req.query);
    return success(res, result.items, 'Danh sách nhật ký kiểm toán hệ thống', 200, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

async function getLogById(req, res, next) {
  try {
    const log = await auditService.getLogById(req.params.id);
    if (!log) {
      throw new AppError('Không tìm thấy bản ghi nhật ký kiểm toán', 404, 'AUDIT_LOG_NOT_FOUND');
    }
    return success(res, log, 'Chi tiết nhật ký kiểm toán');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLogs,
  getLogById,
};
