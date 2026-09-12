const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/notifications
router.get('/', (req, res) => {
  return success(res, [], 'Danh sách thông báo nội bộ');
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', (req, res) => {
  return success(res, { id: req.params.id, isRead: true }, 'Đã đánh dấu thông báo là đã đọc');
});

module.exports = router;
