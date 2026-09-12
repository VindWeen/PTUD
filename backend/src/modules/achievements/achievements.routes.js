const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/achievements
router.get('/', (req, res) => {
  return success(res, [], 'Danh sách thành tích');
});

// POST /api/v1/achievements
router.post('/', (req, res) => {
  return success(res, { id: 1, ...req.body }, 'Tạo thành tích mới (DRAFT)', 201);
});

// GET /api/v1/achievements/:id
router.get('/:id', (req, res) => {
  return success(res, { id: req.params.id }, 'Chi tiết thành tích');
});

// PATCH /api/v1/achievements/:id
router.patch('/:id', (req, res) => {
  return success(res, { id: req.params.id, ...req.body }, 'Cập nhật thành tích');
});

// DELETE /api/v1/achievements/:id
router.delete('/:id', (req, res) => {
  return success(res, null, 'Xóa bản nháp thành tích thành công');
});

// POST /api/v1/achievements/:id/submit
router.post('/:id/submit', (req, res) => {
  return success(res, { id: req.params.id, status: 'SUBMITTED' }, 'Gửi duyệt thành tích thành công');
});

// POST /api/v1/achievements/:id/cancel
router.post('/:id/cancel', (req, res) => {
  return success(res, { id: req.params.id, status: 'CANCELLED' }, 'Hủy nộp thành tích thành công');
});

// GET /api/v1/achievements/:id/history
router.get('/:id/history', (req, res) => {
  return success(res, [], 'Lịch sử thay đổi trạng thái thành tích');
});

module.exports = router;
