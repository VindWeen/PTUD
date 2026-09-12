const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/award-records
router.get('/', (req, res) => {
  return success(res, [], 'Danh sách kết quả khen thưởng đã ghi nhận');
});

// POST /api/v1/award-records (RecordsOfficer / Admin)
router.post('/', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), (req, res) => {
  return success(res, { id: 1, ...req.body }, 'Ghi nhận quyết định khen thưởng mới', 201);
});

// PATCH /api/v1/award-records/:id
router.patch('/:id', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), (req, res) => {
  return success(res, { id: req.params.id, ...req.body }, 'Điều chỉnh bản ghi khen thưởng');
});

// POST /api/v1/award-records/:id/revoke
router.post('/:id/revoke', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), (req, res) => {
  return success(res, { id: req.params.id, status: 'REVOKED' }, 'Thu hồi quyết định khen thưởng thành công');
});

// GET /api/v1/award-records/:id/history
router.get('/:id/history', (req, res) => {
  return success(res, [], 'Lịch sử ghi nhận/thu hồi khen thưởng');
});

module.exports = router;
