const achievementsRepository = require('./achievements.repository');
const { getPool, sql } = require('../../config/database');
const AppError = require('../../utils/appError');
const { ACHIEVEMENT_STATUS, ROLES } = require('../../config/constants');
const orgService = require('../organizations/organizations.service');
const notifService = require('../notifications/notifications.service');

class AchievementsService {
  async getLecturerByUserId(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT l.Id, l.StaffCode, la.UnitId AS CurrentUnitId
        FROM Lecturers l
        LEFT JOIN LecturerAssignments la ON l.Id = la.LecturerId AND la.IsPrimary = 1 AND la.ValidTo IS NULL
        WHERE l.UserId = @userId
      `);
    return result.recordset[0] || null;
  }

  async create(data, currentUser) {
    let { lecturerId, organizationUnitId, contextUnitId } = data;
    let lecturer = null;

    // Nếu là giảng viên tự kê khai mà chưa truyền lecturerId, tự lấy theo UserId
    if (!lecturerId && !organizationUnitId) {
      lecturer = await this.getLecturerByUserId(currentUser.id);
      if (lecturer) {
        lecturerId = lecturer.Id;
      }
    } else if (lecturerId) {
      lecturer = await this.getLecturerByUserId(currentUser.id);
    }

    // Blueprint Rule: XOR check
    const hasLecturer = !!lecturerId;
    const hasUnit = !!organizationUnitId;
    if ((hasLecturer && hasUnit) || (!hasLecturer && !hasUnit)) {
      throw new AppError(
        'Thành tích phải thuộc về đúng 1 Giảng viên HOẶC 1 Đơn vị (XOR Rule)',
        400,
        'INVALID_OWNER'
      );
    }

    // Blueprint Rule 2: Đại diện chỉ nộp cho đơn vị được giao, hết hạn thì mất quyền thao tác
    if (hasUnit && !currentUser.roles.includes(ROLES.ADMIN)) {
      const repValidation = await orgService.validateUnitRepresentative(currentUser.id, organizationUnitId);
      if (!repValidation.isValid) {
        throw new AppError(
          repValidation.message || 'Bạn không có quyền đại diện kê khai thành tích cho đơn vị này (Rule 2)',
          403,
          repValidation.reason || 'FORBIDDEN_NOT_UNIT_REPRESENTATIVE'
        );
      }
    }

    // Tự động gán contextUnitId nếu chưa chọn
    if (!contextUnitId) {
      if (organizationUnitId) {
        contextUnitId = organizationUnitId;
      } else if (lecturer && lecturer.CurrentUnitId) {
        contextUnitId = lecturer.CurrentUnitId;
      } else {
        // Lấy đơn vị mặc định đầu tiên nếu chưa có phân công
        const pool = await getPool();
        const defaultUnit = await pool.request().query('SELECT TOP 1 Id FROM OrganizationUnits WHERE IsActive = 1 ORDER BY Id');
        if (defaultUnit.recordset[0]) {
          contextUnitId = defaultUnit.recordset[0].Id;
        }
      }
    }

    const payload = {
      ...data,
      lecturerId,
      organizationUnitId,
      contextUnitId,
      status: ACHIEVEMENT_STATUS.DRAFT,
      createdBy: currentUser.id,
    };

    return await achievementsRepository.create(payload);
  }

  async findAll(query, currentUser) {
    const filter = {
      page: parseInt(query.page || '1', 10),
      pageSize: parseInt(query.pageSize || '20', 10),
      year: query.year ? parseInt(query.year, 10) : null,
      status: query.status || null,
      contextUnitId: query.unitId ? parseInt(query.unitId, 10) : null,
    };

    // Nếu người dùng chỉ có vai trò Lecturer, mặc định chỉ xem thành tích của chính mình
    const isLecturerOnly =
      currentUser.roles.includes(ROLES.LECTURER) &&
      !currentUser.roles.includes(ROLES.ADMIN) &&
      !currentUser.roles.includes(ROLES.MANAGER);

    if (isLecturerOnly) {
      const lecturer = await this.getLecturerByUserId(currentUser.id);
      if (lecturer) {
        filter.lecturerId = lecturer.Id;
      }
    } else if (query.lecturerId) {
      filter.lecturerId = parseInt(query.lecturerId, 10);
    }

    return await achievementsRepository.findAll(filter);
  }

  async findById(id) {
    const achievement = await achievementsRepository.findById(id);
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'NOT_FOUND');
    }
    return achievement;
  }

  async deleteDraft(id, currentUser) {
    const achievement = await achievementsRepository.findById(id);
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'NOT_FOUND');
    }

    // Blueprint Rule: Chỉ bản nháp DRAFT mới được xóa
    if (achievement.Status !== ACHIEVEMENT_STATUS.DRAFT) {
      throw new AppError(
        'Chỉ có thể xóa hồ sơ ở trạng thái Bản nháp (DRAFT)',
        400,
        'CANNOT_DELETE_SUBMITTED'
      );
    }

    // Kiểm tra quyền sở hữu
    if (achievement.CreatedBy !== currentUser.id && !currentUser.roles.includes(ROLES.ADMIN)) {
      throw new AppError('Bạn không có quyền xóa hồ sơ của người khác', 403, 'FORBIDDEN');
    }

    await achievementsRepository.deleteDraft(id);
  }

  async update(id, data, currentUser, expectedRowVersion) {
    const achievement = await achievementsRepository.findById(id);
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'NOT_FOUND');
    }

    // Blueprint Rule: Chỉ DRAFT hoặc NEED_CORRECTION được sửa
    if (achievement.Status !== ACHIEVEMENT_STATUS.DRAFT && achievement.Status !== ACHIEVEMENT_STATUS.NEED_CORRECTION) {
      throw new AppError(
        `Chỉ có thể chỉnh sửa hồ sơ ở trạng thái Bản nháp (DRAFT) hoặc Cần bổ sung (NEED_CORRECTION). Trạng thái hiện tại: ${achievement.Status}`,
        400,
        'INVALID_STATUS_FOR_UPDATE'
      );
    }

    if (achievement.CreatedBy !== currentUser.id && !currentUser.roles.includes(ROLES.ADMIN)) {
      throw new AppError('Bạn không có quyền chỉnh sửa hồ sơ này', 403, 'FORBIDDEN');
    }

    const updated = await achievementsRepository.update(id, data, expectedRowVersion);
    if (!updated) {
      throw new AppError(
        'Hồ sơ đã bị thay đổi bởi người dùng khác hoặc thao tác đồng thời. Vui lòng tải lại trang.',
        409,
        'CONCURRENCY_CONFLICT'
      );
    }

    return updated;
  }

  async cancel(id, reason, currentUser, expectedRowVersion) {
    const pool = await getPool();
    const checkRes = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT Id, Status, CreatedBy, CONVERT(VARCHAR(30), RowVersion, 1) AS RowVersion
        FROM Achievements
        WHERE Id = @id
      `);

    const achievement = checkRes.recordset[0];
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'NOT_FOUND');
    }

    if (
      achievement.Status !== ACHIEVEMENT_STATUS.DRAFT &&
      achievement.Status !== ACHIEVEMENT_STATUS.SUBMITTED &&
      achievement.Status !== ACHIEVEMENT_STATUS.NEED_CORRECTION
    ) {
      throw new AppError(
        `Không thể hủy hồ sơ đang ở trạng thái ${achievement.Status}`,
        400,
        'INVALID_STATUS_FOR_CANCEL'
      );
    }

    if (achievement.CreatedBy !== currentUser.id && !currentUser.roles.includes(ROLES.ADMIN)) {
      throw new AppError('Bạn không có quyền hủy hồ sơ này', 403, 'FORBIDDEN');
    }

    if (
      (achievement.Status === ACHIEVEMENT_STATUS.SUBMITTED || achievement.Status === ACHIEVEMENT_STATUS.NEED_CORRECTION) &&
      (!reason || !reason.trim())
    ) {
      throw new AppError('Vui lòng nhập lý do khi hủy hồ sơ đã nộp', 400, 'REASON_REQUIRED');
    }

    if (expectedRowVersion && achievement.RowVersion !== expectedRowVersion) {
      throw new AppError(
        'Hồ sơ đã bị thay đổi bởi người dùng khác hoặc thao tác đồng thời. Vui lòng tải lại trang.',
        409,
        'CONCURRENCY_CONFLICT'
      );
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const updateReq = new sql.Request(transaction);
      updateReq.input('id', sql.Int, id);
      await updateReq.query(`
        UPDATE Achievements
        SET Status = 'CANCELLED', UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);

      const histReq = new sql.Request(transaction);
      histReq.input('achievementId', sql.Int, id);
      histReq.input('fromStatus', sql.NVarChar(30), achievement.Status);
      histReq.input('toStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.CANCELLED);
      histReq.input('actorId', sql.Int, currentUser.id);
      histReq.input('reason', sql.NVarChar(sql.MAX), reason ? reason.trim() : 'Người kê khai hủy hồ sơ');

      await histReq.query(`
        INSERT INTO AchievementStatusHistories (AchievementId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (@achievementId, @fromStatus, @toStatus, @actorId, @reason)
      `);

      await transaction.commit();

      return {
        id,
        status: ACHIEVEMENT_STATUS.CANCELLED,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async submit(id, currentUser, notes = null, expectedRowVersion = null) {
    const achievement = await achievementsRepository.findById(id);
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'NOT_FOUND');
    }

    if (expectedRowVersion && achievement.RowVersion !== expectedRowVersion) {
      throw new AppError(
        'Hồ sơ đã bị thay đổi bởi người dùng khác hoặc thao tác đồng thời. Vui lòng tải lại trang.',
        409,
        'CONCURRENCY_CONFLICT'
      );
    }

    // Blueprint Rule 5: Chỉ nộp từ DRAFT hoặc NEED_CORRECTION
    if (achievement.Status !== ACHIEVEMENT_STATUS.DRAFT && achievement.Status !== ACHIEVEMENT_STATUS.NEED_CORRECTION) {
      throw new AppError(
        `Không thể nộp hồ sơ đang ở trạng thái ${achievement.Status}`,
        400,
        'INVALID_STATUS_FOR_SUBMIT'
      );
    }

    // Kiểm tra quyền nộp (phải là người tạo hoặc Admin)
    if (achievement.CreatedBy !== currentUser.id && !currentUser.roles.includes(ROLES.ADMIN)) {
      throw new AppError('Bạn không có quyền nộp hồ sơ này', 403, 'FORBIDDEN');
    }

    const pool = await getPool();

    // Blueprint Rule 5: Phải có ít nhất 1 minh chứng đính kèm
    const filesRes = await pool
      .request()
      .input('achievementId', sql.Int, id)
      .query(`
        SELECT ef.Id AS EvidenceFileId
        FROM EvidenceFiles ef
        INNER JOIN Evidences e ON ef.EvidenceId = e.Id
        WHERE e.AchievementId = @achievementId
      `);

    const evidenceFiles = filesRes.recordset;
    if (!evidenceFiles || evidenceFiles.length === 0) {
      throw new AppError(
        'Hồ sơ phải có ít nhất 1 tài liệu minh chứng số để có thể nộp xét duyệt',
        400,
        'MIN_EVIDENCE_REQUIRED'
      );
    }

    // Xác định RevisionNo tiếp theo
    const revRes = await pool
      .request()
      .input('achievementId', sql.Int, id)
      .query('SELECT ISNULL(MAX(RevisionNo), 0) + 1 AS NextRev FROM AchievementSubmissions WHERE AchievementId = @achievementId');
    const nextRevision = revRes.recordset[0].NextRev;

    // Snapshot JSON nội dung hiện tại
    const snapshotJson = JSON.stringify({
      ...achievement,
      submittedAt: new Date().toISOString(),
      submittedBy: currentUser.id,
    });

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Tạo bản ghi AchievementSubmissions
      const subReq = new sql.Request(transaction);
      subReq.input('achievementId', sql.Int, id);
      subReq.input('revisionNo', sql.Int, nextRevision);
      subReq.input('snapshotJson', sql.NVarChar(sql.MAX), snapshotJson);
      subReq.input('submittedBy', sql.Int, currentUser.id);

      const subInsert = await subReq.query(`
        INSERT INTO AchievementSubmissions (AchievementId, RevisionNo, SnapshotJson, SubmittedBy)
        OUTPUT INSERTED.Id
        VALUES (@achievementId, @revisionNo, @snapshotJson, @submittedBy)
      `);
      const submissionId = subInsert.recordset[0].Id;

      // 2. Gắn các phiên bản file minh chứng vào SubmissionEvidenceFiles
      for (const file of evidenceFiles) {
        const fileLinkReq = new sql.Request(transaction);
        fileLinkReq.input('submissionId', sql.Int, submissionId);
        fileLinkReq.input('evidenceFileId', sql.Int, file.EvidenceFileId);
        await fileLinkReq.query(`
          INSERT INTO SubmissionEvidenceFiles (SubmissionId, EvidenceFileId)
          VALUES (@submissionId, @evidenceFileId)
        `);
      }

      // 3. Cập nhật trạng thái thành tích thành SUBMITTED
      const updateReq = new sql.Request(transaction);
      updateReq.input('id', sql.Int, id);
      updateReq.input('submittedBy', sql.Int, currentUser.id);
      await updateReq.query(`
        UPDATE Achievements
        SET Status = 'SUBMITTED', SubmittedBy = @submittedBy, UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);

      // 4. Lưu vết lịch sử chuyển đổi trạng thái
      const histReq = new sql.Request(transaction);
      histReq.input('achievementId', sql.Int, id);
      histReq.input('submissionId', sql.Int, submissionId);
      histReq.input('fromStatus', sql.NVarChar(30), achievement.Status);
      histReq.input('toStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.SUBMITTED);
      histReq.input('actorId', sql.Int, currentUser.id);
      const submitReason = notes && notes.trim()
        ? notes.trim()
        : (achievement.Status === ACHIEVEMENT_STATUS.NEED_CORRECTION
            ? `Bổ sung và nộp lại hồ sơ xét duyệt (Lần ${nextRevision})`
            : `Nộp hồ sơ xét duyệt (Lần ${nextRevision})`);
      histReq.input('reason', sql.NVarChar(sql.MAX), submitReason);

      await histReq.query(`
        INSERT INTO AchievementStatusHistories (AchievementId, SubmissionId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (@achievementId, @submissionId, @fromStatus, @toStatus, @actorId, @reason)
      `);

      await transaction.commit();

      // Bắn thông báo tự động cho các Manager phụ trách đơn vị
      try {
        await notifService.notifyUnitManagers({
          unitId: achievement.ContextUnitId,
          excludeUserId: currentUser.id,
          title: 'Hồ sơ mới cần thẩm định',
          message: `Hồ sơ thành tích "${achievement.Title}" vừa được nộp và đang chờ thẩm định (Lần ${nextRevision}).`,
          type: 'ACTION_REQUIRED',
          relatedEntityType: 'ACHIEVEMENT',
          relatedEntityId: id,
          actionUrl: '/approvals'
        });
      } catch (notifErr) {
        console.error('Failed to send notification to managers:', notifErr);
      }

      return {
        id,
        status: ACHIEVEMENT_STATUS.SUBMITTED,
        revisionNo: nextRevision,
        submissionId,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getHistory(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          h.Id, h.FromStatus, h.ToStatus, h.Reason, h.CreatedAt,
          u.FullName AS ActorName, u.Username AS ActorUsername,
          (SELECT TOP 1 r.Name FROM UserRoles ur INNER JOIN Roles r ON ur.RoleId = r.Id WHERE ur.UserId = u.Id) AS ActorRole
        FROM AchievementStatusHistories h
        INNER JOIN Users u ON h.ActorId = u.Id
        WHERE h.AchievementId = @id
        ORDER BY h.CreatedAt ASC
      `);
    return result.recordset;
  }
}

module.exports = new AchievementsService();
