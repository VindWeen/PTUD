const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/reports/achievements
router.get('/achievements', (req, res) => {
  return success(res, { summary: {}, items: [] }, 'Báo cáo thống kê thành tích');
});

// GET /api/v1/reports/awards
router.get('/awards', (req, res) => {
  return success(res, { summary: {}, items: [] }, 'Báo cáo thống kê khen thưởng');
});

// GET /api/v1/reports/export
router.get('/export', (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-thanh-tich.csv"');
  return res.send('\uFEFFSTT,Chủ thể,Loại thành tích,Năm ghi nhận,Trạng thái\n');
});

module.exports = router;
