const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

router.use(authenticate);

// POST /api/v1/achievements/:id/evidences
router.post('/achievements/:id/evidences', (req, res) => {
  return success(res, { id: 1, achievementId: req.params.id }, 'Đính kèm minh chứng mới', 201);
});

// POST /api/v1/evidences/:id/versions
router.post('/:id/versions', (req, res) => {
  return success(res, { id: req.params.id, version: 2 }, 'Tải lên phiên bản mới của minh chứng', 201);
});

// DELETE /api/v1/evidences/:id
router.delete('/:id', (req, res) => {
  return success(res, null, 'Xóa minh chứng khỏi bản nháp');
});

// GET /api/v1/evidence-files/:id/download
router.get('/files/:id/download', (req, res) => {
  return success(res, { fileId: req.params.id }, 'Tải file minh chứng');
});

module.exports = router;
