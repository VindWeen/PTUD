const express = require('express');
const { create, findAll, findById, getTypes, deleteDraft, update, cancel, submit, getHistory } = require('./achievements.controller');
const { createAchievementSchema } = require('./achievements.validator');
const validate = require('../../middlewares/validate.middleware');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const approvalsController = require('../approvals/approvals.controller');

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

// PATCH /api/v1/achievements/:id (Cập nhật hồ sơ DRAFT hoặc NEED_CORRECTION)
router.patch('/:id', update);

// POST /api/v1/achievements/:id/submit (Nộp hoặc Nộp lại hồ sơ xét duyệt)
router.post('/:id/submit', submit);

// POST /api/v1/achievements/:id/cancel (Hủy kê khai hồ sơ DRAFT/SUBMITTED/NEED_CORRECTION)
router.post('/:id/cancel', cancel);

// Aliases theo Blueprint Mục 10
// POST /api/v1/achievements/:id/request-correction (Yêu cầu bổ sung)
router.post('/:id/request-correction', requireRoles(ROLES.MANAGER, ROLES.ADMIN), approvalsController.requestCorrection);

// POST /api/v1/achievements/:id/reject (Từ chối)
router.post('/:id/reject', requireRoles(ROLES.MANAGER, ROLES.ADMIN), approvalsController.reject);

// POST /api/v1/achievements/:id/revoke (Thu hồi)
router.post('/:id/revoke', requireRoles(ROLES.MANAGER, ROLES.ADMIN), approvalsController.revoke);

// GET /api/v1/achievements/:id/history (Lịch sử chuyển đổi trạng thái)
router.get('/:id/history', getHistory);

// DELETE /api/v1/achievements/:id (Chỉ bản nháp DRAFT)
router.delete('/:id', deleteDraft);

module.exports = router;
