const express = require('express');
const { create, findAll, findById, getTypes, deleteDraft, submit, getHistory } = require('./achievements.controller');
const { createAchievementSchema } = require('./achievements.validator');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/achievements/types (Danh mục loại thành tích)
router.get('/types', getTypes);

// GET /api/v1/achievements
router.get('/', findAll);

// POST /api/v1/achievements
router.post('/', validate(createAchievementSchema), create);

// GET /api/v1/achievements/:id
router.get('/:id', findById);

// POST /api/v1/achievements/:id/submit (Nộp hồ sơ xét duyệt)
router.post('/:id/submit', submit);

// GET /api/v1/achievements/:id/history (Lịch sử chuyển đổi trạng thái)
router.get('/:id/history', getHistory);

// DELETE /api/v1/achievements/:id (Chỉ bản nháp DRAFT)
router.delete('/:id', deleteDraft);

module.exports = router;
