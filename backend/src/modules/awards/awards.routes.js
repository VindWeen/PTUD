const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const { upload } = require('../../middlewares/upload.middleware');
const {
  getTypes,
  getDecisions,
  getDecisionById,
  createDecision,
  findAllRecords,
  findRecordById,
  createRecord,
  updateRecord,
  recordAward,
  revokeAward,
  getRecordHistory,
} = require('./awards.controller');

const router = express.Router();

router.use(authenticate);

// Danh mục loại khen thưởng
router.get('/types', getTypes);

// Danh sách & Chi tiết quyết định khen thưởng
router.get('/decisions', getDecisions);
router.get('/decisions/:id', getDecisionById);
router.post('/decisions', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), upload.single('file'), createDecision);

// Bản ghi Khen thưởng (AwardRecords) - Hỗ trợ cả 2 chuẩn route /awards/... và /award-records/...
router.get('/', findAllRecords);
router.get('/records', findAllRecords);
router.post('/', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), createRecord);
router.post('/records', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), createRecord);

router.get('/:id', findRecordById);
router.get('/records/:id', findRecordById);

router.patch('/:id', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), updateRecord);
router.patch('/records/:id', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), updateRecord);

router.post('/:id/record', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), recordAward);
router.post('/records/:id/record', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), recordAward);

router.post('/:id/revoke', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), revokeAward);
router.post('/records/:id/revoke', requireRoles(ROLES.RECORDS_OFFICER, ROLES.ADMIN), revokeAward);

router.get('/:id/history', getRecordHistory);
router.get('/records/:id/history', getRecordHistory);

module.exports = router;
