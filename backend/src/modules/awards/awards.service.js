const fs = require('fs');
const crypto = require('crypto');
const awardsRepository = require('./awards.repository');
const { getPool, sql } = require('../../config/database');
const AppError = require('../../utils/appError');
const { ROLES } = require('../../config/constants');
const notifService = require('../notifications/notifications.service');

class AwardsService {
  calculateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  async getTypes() {
    return await awardsRepository.getTypes();
  }

  async getDecisions(search) {
    return await awardsRepository.getDecisions(search);
  }

  async findDecisionById(id) {
    const decision = await awardsRepository.findDecisionById(id);
    if (!decision) {
      throw new AppError('Không tìm thấy quyết định khen thưởng', 404, 'NOT_FOUND');
    }
    return decision;
  }

  async createDecision(data, file, currentUser) {
    if (!data.decisionNumber || !data.decisionNumber.trim()) {
      throw new AppError('Vui lòng nhập số quyết định', 400, 'DECISION_NUMBER_REQUIRED');
    }
    if (!data.signDate) {
      throw new AppError('Vui lòng chọn ngày ký quyết định', 400, 'SIGN_DATE_REQUIRED');
    }
    if (!data.issuingAuthority || !data.issuingAuthority.trim()) {
      throw new AppError('Vui lòng nhập cơ quan ban hành quyết định', 400, 'AUTHORITY_REQUIRED');
    }

    const existing = await awardsRepository.findDecisionByNumber(data.decisionNumber);
    if (existing) {
      throw new AppError(
        `Số quyết định "${data.decisionNumber.trim()}" đã tồn tại trong hệ thống`,
        400,
        'DUPLICATE_DECISION_NUMBER'
      );
    }

    let fileData = null;
    if (file) {
      const fileHash = this.calculateFileHash(file.path);
      fileData = {
        originalFileName: file.originalname,
        storageFileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        fileHash,
      };
    }

    return await awardsRepository.createDecision(data, fileData, currentUser.id);
  }

  async createRecord(data, currentUser) {
    let { lecturerId, organizationUnitId, contextUnitId, awardTypeId, decisionId, recognitionYear, status, notes, achievementIds } = data;

    if (!awardTypeId) {
      throw new AppError('Vui lòng chọn loại danh hiệu khen thưởng', 400, 'AWARD_TYPE_REQUIRED');
    }
    if (!decisionId) {
      throw new AppError('Vui lòng chọn hoặc nhập quyết định khen thưởng', 400, 'DECISION_REQUIRED');
    }
    if (!recognitionYear) {
      throw new AppError('Vui lòng nhập năm ghi nhận khen thưởng', 400, 'YEAR_REQUIRED');
    }

    // Blueprint Rule: XOR Chủ thể
    const hasLecturer = !!lecturerId;
    const hasUnit = !!organizationUnitId;
    if ((hasLecturer && hasUnit) || (!hasLecturer && !hasUnit)) {
      throw new AppError(
        'Khen thưởng phải thuộc về đúng 1 Giảng viên HOẶC 1 Đơn vị tập thể (XOR Rule)',
        400,
        'INVALID_OWNER'
      );
    }

    // Tự động suy ra ContextUnitId nếu chưa có
    if (!contextUnitId) {
      if (organizationUnitId) {
        contextUnitId = organizationUnitId;
      } else if (lecturerId) {
        const pool = await getPool();
        const laRes = await pool.request().input('lId', sql.Int, lecturerId).query(`
          SELECT TOP 1 UnitId FROM LecturerAssignments WHERE LecturerId = @lId AND IsPrimary = 1 AND ValidTo IS NULL
        `);
        contextUnitId = laRes.recordset[0]?.UnitId || null;
      }

      if (!contextUnitId) {
        const pool = await getPool();
        const defUnit = await pool.request().query('SELECT TOP 1 Id FROM OrganizationUnits WHERE IsActive = 1 ORDER BY Id');
        contextUnitId = defUnit.recordset[0]?.Id;
      }
    }

    const recordStatus = status === 'RECORDED' ? 'RECORDED' : 'DRAFT';

    // Blueprint Rule 9: Chặn trùng chủ thể + loại khen thưởng + quyết định cho RECORDED
    if (recordStatus === 'RECORDED') {
      const isDuplicate = await awardsRepository.checkDuplicateRecorded(lecturerId, organizationUnitId, awardTypeId, decisionId);
      if (isDuplicate) {
        throw new AppError(
          'Chủ thể này đã được ghi nhận danh hiệu khen thưởng trong văn bản quyết định này (Rule 9: Chống trùng lặp)',
          400,
          'DUPLICATE_AWARD_RECORD'
        );
      }
    }

    const newRecord = await awardsRepository.createRecord(
      {
        lecturerId,
        organizationUnitId,
        contextUnitId,
        awardTypeId,
        decisionId,
        recognitionYear: parseInt(recognitionYear, 10),
        status: recordStatus,
        notes,
      },
      currentUser.id
    );

    // Liên kết thành tích căn cứ (nếu có)
    if (achievementIds && Array.isArray(achievementIds) && achievementIds.length > 0) {
      await awardsRepository.linkAchievements(newRecord.Id, achievementIds);
    }

    // Lưu vết lịch sử
    const historyReason = recordStatus === 'RECORDED'
      ? 'Nhập và ghi nhận chính thức quyết định khen thưởng'
      : 'Tạo bản nháp kết quả khen thưởng';
    await awardsRepository.createHistory(newRecord.Id, null, recordStatus, currentUser.id, historyReason);

    // Tự động bắn thông báo chúc mừng vinh danh khen thưởng
    if (recordStatus === 'RECORDED') {
      try {
        const pool = await getPool();
        let targetUserId = null;
        if (lecturerId) {
          const lRes = await pool.request().input('lId', sql.Int, lecturerId).query('SELECT UserId FROM Lecturers WHERE Id = @lId');
          targetUserId = lRes.recordset[0]?.UserId;
        } else if (organizationUnitId) {
          const repRes = await pool.request().input('uId', sql.Int, organizationUnitId).query('SELECT TOP 1 UserId FROM UnitRepresentatives WHERE UnitId = @uId AND IsActive = 1 ORDER BY CreatedAt DESC');
          targetUserId = repRes.recordset[0]?.UserId;
        }

        if (targetUserId) {
          await notifService.sendNotification({
            userId: targetUserId,
            title: 'Vinh danh Danh hiệu Khen thưởng',
            message: `Bạn/Đơn vị của bạn đã được trao tặng danh hiệu thi đua mới theo Quyết định khen thưởng chính thức.`,
            type: 'SUCCESS',
            relatedEntityType: 'AWARD',
            relatedEntityId: newRecord.Id,
            actionUrl: '/awards'
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify award recipient:', notifErr);
      }
    }

    return newRecord;
  }

  async findAllRecords(query, currentUser) {
    const filter = {
      page: parseInt(query.page || '1', 10),
      pageSize: parseInt(query.pageSize || '20', 10),
      year: query.year ? parseInt(query.year, 10) : null,
      status: query.status || null,
      category: query.category || null,
      awardTypeId: query.awardTypeId ? parseInt(query.awardTypeId, 10) : null,
      decisionId: query.decisionId ? parseInt(query.decisionId, 10) : null,
      contextUnitId: query.unitId ? parseInt(query.unitId, 10) : null,
      search: query.search || '',
    };

    // Nếu chỉ là Giảng viên (không phải Admin, RecordsOfficer, Manager), mặc định xem của mình
    const isLecturerOnly =
      currentUser.roles.includes(ROLES.LECTURER) &&
      !currentUser.roles.includes(ROLES.ADMIN) &&
      !currentUser.roles.includes(ROLES.RECORDS_OFFICER) &&
      !currentUser.roles.includes(ROLES.MANAGER);

    if (isLecturerOnly) {
      const pool = await getPool();
      const lRes = await pool.request().input('userId', sql.Int, currentUser.id).query('SELECT Id FROM Lecturers WHERE UserId = @userId');
      if (lRes.recordset[0]) {
        filter.lecturerId = lRes.recordset[0].Id;
      }
    } else if (query.lecturerId) {
      filter.lecturerId = parseInt(query.lecturerId, 10);
    }

    return await awardsRepository.findAllRecords(filter);
  }

  async findRecordById(id) {
    const record = await awardsRepository.findRecordById(id);
    if (!record) {
      throw new AppError('Không tìm thấy bản ghi khen thưởng', 404, 'NOT_FOUND');
    }
    return record;
  }

  async updateRecord(id, data, currentUser, expectedRowVersion) {
    const record = await awardsRepository.findRecordById(id);
    if (!record) {
      throw new AppError('Không tìm thấy bản ghi khen thưởng', 404, 'NOT_FOUND');
    }

    if (record.Status !== 'DRAFT') {
      throw new AppError('Chỉ có thể chỉnh sửa bản ghi khen thưởng ở trạng thái DRAFT', 400, 'CANNOT_UPDATE_RECORDED');
    }

    const updated = await awardsRepository.updateRecord(id, data, expectedRowVersion);
    if (!updated) {
      throw new AppError(
        'Bản ghi khen thưởng đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.',
        409,
        'CONCURRENCY_CONFLICT'
      );
    }

    if (data.achievementIds && Array.isArray(data.achievementIds)) {
      await awardsRepository.linkAchievements(id, data.achievementIds);
    }

    return updated;
  }

  async recordAward(id, currentUser, expectedRowVersion) {
    const record = await awardsRepository.findRecordById(id);
    if (!record) {
      throw new AppError('Không tìm thấy bản ghi khen thưởng', 404, 'NOT_FOUND');
    }

    if (record.Status !== 'DRAFT') {
      throw new AppError(`Chỉ có thể ghi nhận bản ghi ở trạng thái DRAFT. Trạng thái hiện tại: ${record.Status}`, 400, 'INVALID_STATUS');
    }

    // Blueprint Rule 9: Chống trùng lặp
    const isDuplicate = await awardsRepository.checkDuplicateRecorded(
      record.LecturerId,
      record.OrganizationUnitId,
      record.AwardTypeId,
      record.DecisionId
    );
    if (isDuplicate) {
      throw new AppError(
        'Chủ thể này đã được ghi nhận danh hiệu trong quyết định này (Rule 9: Chống trùng lặp)',
        400,
        'DUPLICATE_AWARD_RECORD'
      );
    }

    const updated = await awardsRepository.recordAward(id, currentUser.id, expectedRowVersion);
    if (!updated) {
      throw new AppError(
        'Bản ghi khen thưởng đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.',
        409,
        'CONCURRENCY_CONFLICT'
      );
    }

    await awardsRepository.createHistory(id, 'DRAFT', 'RECORDED', currentUser.id, 'Chính thức ghi nhận kết quả khen thưởng');
    return updated;
  }

  async revokeAward(id, reason, currentUser, expectedRowVersion) {
    if (!reason || !reason.trim()) {
      throw new AppError('Vui lòng nhập lý do giải trình khi thu hồi kết quả khen thưởng', 400, 'REASON_REQUIRED');
    }

    const record = await awardsRepository.findRecordById(id);
    if (!record) {
      throw new AppError('Không tìm thấy bản ghi khen thưởng', 404, 'NOT_FOUND');
    }

    if (record.Status !== 'RECORDED') {
      throw new AppError(`Chỉ có thể thu hồi bản ghi ở trạng thái RECORDED. Trạng thái hiện tại: ${record.Status}`, 400, 'INVALID_STATUS');
    }

    const updated = await awardsRepository.revokeAward(id, currentUser.id, expectedRowVersion);
    if (!updated) {
      throw new AppError(
        'Bản ghi khen thưởng đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.',
        409,
        'CONCURRENCY_CONFLICT'
      );
    }

    await awardsRepository.createHistory(id, 'RECORDED', 'REVOKED', currentUser.id, reason.trim());
    return updated;
  }

  async getRecordHistory(id) {
    return await awardsRepository.getRecordHistory(id);
  }
}

module.exports = new AwardsService();
