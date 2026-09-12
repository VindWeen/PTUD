const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/units/:id/profile
router.get('/:id/profile', (req, res) => {
  return success(res, { id: req.params.id }, 'Hồ sơ đơn vị');
});

// GET /api/v1/units/:id/achievements
router.get('/:id/achievements', (req, res) => {
  return success(res, [], 'Danh sách thành tích tập thể của đơn vị');
});

module.exports = router;
