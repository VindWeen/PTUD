const express = require('express');
const { uploadToAchievement, downloadFile } = require('./evidences.controller');
const { upload } = require('../../middlewares/upload.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

// POST /api/v1/evidences/achievements/:id (Upload minh chứng cho thành tích)
router.post('/achievements/:id', upload.single('file'), uploadToAchievement);

// GET /api/v1/evidences/files/:id/download (Tải file minh chứng)
router.get('/files/:id/download', downloadFile);

module.exports = router;
