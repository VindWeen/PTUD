const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const reportsController = require('./reports.controller');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/reports/summary (Dữ liệu tổng quan cho Dashboard cá nhân & đơn vị)
router.get('/summary', reportsController.getDashboardSummary);

// GET /api/v1/reports/achievements (Báo cáo chi tiết thành tích)
router.get('/achievements', reportsController.getAchievementsReport);

// GET /api/v1/reports/awards (Báo cáo chi tiết khen thưởng)
router.get('/awards', reportsController.getAwardsReport);

// GET /api/v1/reports/export (Xuất file CSV an toàn chống CSV Injection)
router.get('/export', reportsController.exportCsv);

module.exports = router;
