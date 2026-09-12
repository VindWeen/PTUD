const express = require('express');
const { create, findAll, findById, getTypes, deleteDraft } = require('./achievements.controller');
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

// DELETE /api/v1/achievements/:id (Chỉ bản nháp DRAFT)
router.delete('/:id', deleteDraft);

module.exports = router;
