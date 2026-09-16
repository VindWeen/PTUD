const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const auditController = require('./audit.controller');

const router = express.Router();

router.use(authenticate);

// Toàn bộ các endpoint audit logs chỉ dành riêng cho vai trò ADMIN
router.use(requireRoles(ROLES.ADMIN));

// GET /api/v1/audit-logs (Danh sách nhật ký kiểm toán)
router.get('/', auditController.getLogs);

// GET /api/v1/audit-logs/:id (Chi tiết 1 bản ghi kiểm toán)
router.get('/:id', auditController.getLogById);

module.exports = router;
