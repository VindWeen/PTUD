const AppError = require('../utils/appError');

/**
 * Middleware kiểm tra quyền phạm vi đơn vị (Unit Scope)
 * - Phạm vi đơn vị được cấp qua UserUnitScopes
 * - Đảm bảo nguyên tắc Blueprint: Người tạo/nộp không được tự xác nhận hồ sơ của mình
 */
function checkUnitScope(getUnitIdFromRequest) {
  return (req, res, next) => {
    const targetUnitId = typeof getUnitIdFromRequest === 'function' 
      ? getUnitIdFromRequest(req) 
      : req.params.unitId || req.body.unitId;

    if (!targetUnitId) {
      return next();
    }

    // Admin có thể bỏ qua hoặc kiểm tra quyền riêng
    if (req.user && req.user.roles && req.user.roles.includes('Admin')) {
      return next();
    }

    const scopes = req.user.unitScopes || [];
    const hasScope = scopes.some((s) => s.unitId === parseInt(targetUnitId, 10));

    if (!hasScope) {
      return next(new AppError('Bạn không có quyền quản lý trên phạm vi đơn vị này', 403, 'FORBIDDEN_SCOPE'));
    }

    next();
  };
}

/**
 * Middleware chống tự duyệt (Anti Self Approval)
 * Manager không được xác nhận hồ sơ thành tích cá nhân của chính mình
 */
function preventSelfApproval(getOwnerIdFromResource) {
  return async (req, res, next) => {
    const ownerId = await getOwnerIdFromResource(req);
    if (req.user && req.user.id === ownerId) {
      return next(new AppError('Quy tắc nghiệp vụ: Bạn không được tự xác nhận hồ sơ của chính mình', 403, 'SELF_APPROVAL_NOT_ALLOWED'));
    }
    next();
  };
}

module.exports = {
  checkUnitScope,
  preventSelfApproval,
};
