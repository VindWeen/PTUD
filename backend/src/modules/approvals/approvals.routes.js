const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const {
  getPending,
  getVerified,
  verify,
  requestCorrection,
  reject,
  revoke,
} = require('./approvals.controller');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/approvals/pending (Hàng chờ xét duyệt trong phạm vi, chặn tự duyệt)
router.get('/pending', requireRoles(ROLES.MANAGER, ROLES.ADMIN), getPending);

// GET /api/v1/approvals/verified (Danh sách hồ sơ đã xác nhận trong phạm vi)
router.get('/verified', requireRoles(ROLES.MANAGER, ROLES.ADMIN), getVerified);

// POST /api/v1/approvals/:id/verify (Xác nhận thành tích VERIFIED, lưu lịch sử, khóa dữ liệu)
router.post('/:id/verify', requireRoles(ROLES.MANAGER, ROLES.ADMIN), verify);

// POST /api/v1/approvals/:id/request-correction (Yêu cầu bổ sung NEED_CORRECTION, có lý do)
router.post('/:id/request-correction', requireRoles(ROLES.MANAGER, ROLES.ADMIN), requestCorrection);

// POST /api/v1/approvals/:id/reject (Từ chối hồ sơ REJECTED, có lý do)
router.post('/:id/reject', requireRoles(ROLES.MANAGER, ROLES.ADMIN), reject);

// POST /api/v1/approvals/:id/revoke (Thu hồi hồ sơ đã xác nhận REVOKED, có lý do)
router.post('/:id/revoke', requireRoles(ROLES.MANAGER, ROLES.ADMIN), revoke);

module.exports = router;
