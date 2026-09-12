const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// Placeholder endpoints for users management (Admin only)
router.get('/', requireRoles(ROLES.ADMIN), (req, res) => {
  return success(res, [], 'Danh sách người dùng');
});

module.exports = router;
