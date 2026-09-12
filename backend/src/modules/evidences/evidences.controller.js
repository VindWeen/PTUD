const evidencesService = require('./evidences.service');
const { success } = require('../../utils/apiResponse');
const AppError = require('../../utils/appError');

async function uploadToAchievement(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Vui lòng chọn file minh chứng đính kèm', 400, 'FILE_REQUIRED');
    }

    const achievementId = parseInt(req.params.id, 10);
    const evidenceName = req.body.name || req.file.originalname;

    const result = await evidencesService.addEvidenceToAchievement(
      achievementId,
      req.file,
      evidenceName,
      req.user
    );

    return success(res, result, 'Đính kèm file minh chứng thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function downloadFile(req, res, next) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const fileRecord = await evidencesService.getFileForDownload(fileId);

    res.setHeader('Content-Type', fileRecord.MimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileRecord.OriginalFileName)}"`
    );
    return res.download(fileRecord.FilePath, fileRecord.OriginalFileName);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadToAchievement,
  downloadFile,
};
