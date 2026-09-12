const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/audit-logs (Admin only)
router.get('/', requireRoles(ROLES.ADMIN), (req, res) => {
  return success(res, [], 'Nhật ký kiểm toán hệ thống (Audit Logs)');
});

module.exports = router;
