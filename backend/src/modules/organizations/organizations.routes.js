const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { success } = require('../../utils/apiResponse');

const { getPool } = require('../../config/database');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/units (Lấy danh sách tất cả đơn vị tổ chức)
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, Code, Name, Type, ParentId 
      FROM OrganizationUnits 
      WHERE IsActive = 1 
      ORDER BY Type ASC, Name ASC
    `);
    return success(res, result.recordset, 'Danh sách đơn vị thành công');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/units/:id/profile
router.get('/:id/profile', (req, res) => {
  return success(res, { id: req.params.id }, 'Hồ sơ đơn vị');
});

// GET /api/v1/units/:id/achievements
router.get('/:id/achievements', (req, res) => {
  return success(res, [], 'Danh sách thành tích tập thể của đơn vị');
});

module.exports = router;
