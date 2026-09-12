const fs = require('fs');
const crypto = require('crypto');
const { getPool, sql } = require('../../config/database');
const AppError = require('../../utils/appError');
const { ACHIEVEMENT_STATUS } = require('../../config/constants');

class EvidencesService {
  calculateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  async addEvidenceToAchievement(achievementId, file, evidenceName, currentUser) {
    const pool = await getPool();

    // 1. Kiểm tra tồn tại và trạng thái của Achievement
    const achievementRes = await pool
      .request()
      .input('id', sql.Int, achievementId)
      .query('SELECT Id, Status, CreatedBy FROM Achievements WHERE Id = @id');

    const achievement = achievementRes.recordset[0];
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'ACHIEVEMENT_NOT_FOUND');
    }

    // Blueprint Rule 5: VERIFIED khóa nội dung & minh chứng, không cho thêm file mới vào hồ sơ đã duyệt
    if (achievement.Status === ACHIEVEMENT_STATUS.VERIFIED) {
      throw new AppError(
        'Hồ sơ đã được xác nhận (VERIFIED) nên bị khóa, không thể thêm minh chứng',
        400,
        'LOCKED_ACHIEVEMENT'
      );
    }

    const fileHash = this.calculateFileHash(file.path);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 2. Tạo bản ghi Evidence
      const evName = evidenceName || file.originalname;
      const evReq = new sql.Request(transaction);
      evReq.input('achievementId', sql.Int, achievementId);
      evReq.input('name', sql.NVarChar(255), evName);

      const evInsert = await evReq.query(`
        INSERT INTO Evidences (AchievementId, Name)
        OUTPUT INSERTED.Id
        VALUES (@achievementId, @name)
      `);
      const evidenceId = evInsert.recordset[0].Id;

      // 3. Tạo bản ghi EvidenceFiles phiên bản 1
      const fileReq = new sql.Request(transaction);
      fileReq.input('evidenceId', sql.Int, evidenceId);
      fileReq.input('versionNo', sql.Int, 1);
      fileReq.input('originalFileName', sql.NVarChar(255), file.originalname);
      fileReq.input('storageFileName', sql.NVarChar(255), file.filename);
      fileReq.input('filePath', sql.NVarChar(500), file.path);
      fileReq.input('mimeType', sql.NVarChar(100), file.mimetype);
      fileReq.input('fileSizeBytes', sql.BigInt, file.size);
      fileReq.input('fileHash', sql.NVarChar(64), fileHash);
      fileReq.input('uploadedBy', sql.Int, currentUser.id);

      const fileInsert = await fileReq.query(`
        INSERT INTO EvidenceFiles (
          EvidenceId, VersionNo, OriginalFileName, StorageFileName, FilePath,
          MimeType, FileSizeBytes, FileHash, UploadedBy
        )
        OUTPUT INSERTED.Id, INSERTED.VersionNo, INSERTED.OriginalFileName, INSERTED.FileHash
        VALUES (
          @evidenceId, @versionNo, @originalFileName, @storageFileName, @filePath,
          @mimeType, @fileSizeBytes, @fileHash, @uploadedBy
        )
      `);

      await transaction.commit();

      return {
        evidenceId,
        file: fileInsert.recordset[0],
      };
    } catch (err) {
      await transaction.rollback();
      // Dọn file tạm nếu thất bại
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw err;
    }
  }

  async getFileForDownload(fileId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, fileId)
      .query(`
        SELECT 
          ef.Id, ef.OriginalFileName, ef.FilePath, ef.MimeType, ef.FileSizeBytes,
          a.Id AS AchievementId, a.Status, a.LecturerId, a.ContextUnitId
        FROM EvidenceFiles ef
        INNER JOIN Evidences e ON ef.EvidenceId = e.Id
        INNER JOIN Achievements a ON e.AchievementId = a.Id
        WHERE ef.Id = @id
      `);

    const fileRecord = result.recordset[0];
    if (!fileRecord) {
      throw new AppError('Không tìm thấy file minh chứng', 404, 'FILE_NOT_FOUND');
    }

    if (!fs.existsSync(fileRecord.FilePath)) {
      throw new AppError('File không còn tồn tại trên kho lưu trữ', 410, 'FILE_MISSING');
    }

    return fileRecord;
  }
}

module.exports = new EvidencesService();
