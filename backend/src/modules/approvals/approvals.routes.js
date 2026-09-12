const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/approvals/pending
router.get('/pending', requireRoles(ROLES.MANAGER, ROLES.ADMIN), (req, res) => {
  return success(res, [], 'Danh sách hồ sơ chờ xác nhận trong phạm vi');
});

// POST /api/v1/approvals/:id/verify
router.post('/:id/verify', requireRoles(ROLES.MANAGER, ROLES.ADMIN), (req, res) => {
  return success(res, { id: req.params.id, status: 'VERIFIED' }, 'Xác nhận thành tích thành công');
});

// POST /api/v1/approvals/:id/request-correction
router.post('/:id/request-correction', requireRoles(ROLES.MANAGER, ROLES.ADMIN), (req, res) => {
  return success(res, { id: req.params.id, status: 'NEED_CORRECTION' }, 'Yêu cầu bổ sung minh chứng thành công');
});

// POST /api/v1/approvals/:id/reject
router.post('/:id/reject', requireRoles(ROLES.MANAGER, ROLES.ADMIN), (req, res) => {
  return success(res, { id: req.params.id, status: 'REJECTED' }, 'Từ chối hồ sơ thành tích thành công');
});

// POST /api/v1/approvals/:id/revoke
router.post('/:id/revoke', requireRoles(ROLES.MANAGER, ROLES.ADMIN), (req, res) => {
  return success(res, { id: req.params.id, status: 'REVOKED' }, 'Thu hồi xác nhận thành tích thành công');
});

module.exports = router;
