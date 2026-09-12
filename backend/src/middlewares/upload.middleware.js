const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../utils/appError');

// Ensure evidence storage directory exists
const evidenceStorageDir = path.resolve(env.STORAGE.path, 'evidences');
if (!fs.existsSync(evidenceStorageDir)) {
  fs.mkdirSync(evidenceStorageDir, { recursive: true });
}

// Multer disk storage with UUID randomized file names (Path traversal protection)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, evidenceStorageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}_${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter (Max 10MB, PDF, JPG, PNG, DOCX)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Định dạng file không được hỗ trợ. Chỉ chấp nhận PDF, JPG, PNG, DOCX.',
        400,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.STORAGE.maxFileSizeMb * 1024 * 1024, // 10MB
  },
});

module.exports = {
  upload,
  evidenceStorageDir,
};
