const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/lecturers/:id
router.get('/:id', (req, res) => {
  return success(res, { id: req.params.id }, 'Hồ sơ năng lực giảng viên');
});

// PATCH /api/v1/lecturers/:id
router.patch('/:id', (req, res) => {
  return success(res, { id: req.params.id, ...req.body }, 'Cập nhật thông tin giảng viên');
});

module.exports = router;
