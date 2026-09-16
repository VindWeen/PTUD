const auditRepository = require('./audit.repository');
const logger = require('../../utils/logger');

class AuditService {
  /**
   * Ghi nhận một sự kiện kiểm toán an toàn (Non-blocking / Fire-and-forget)
   */
  async log({ userId, action, entityType, entityId, oldValues = null, newValues = null, ipAddress = null }) {
    try {
      return await auditRepository.createLog({
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
      });
    } catch (err) {
      logger.error(`[AUDIT_LOG_ERROR] Không thể ghi audit log cho hành động ${action}:`, err.message);
      return null;
    }
  }

  async getLogs(query) {
    return await auditRepository.findAll(query);
  }

  async getLogById(id) {
    return await auditRepository.findById(id);
  }
}

module.exports = new AuditService();
