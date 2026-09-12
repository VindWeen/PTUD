const { getPool, sql } = require('../../config/database');
const AppError = require('../../utils/appError');
const { ACHIEVEMENT_STATUS, ROLES } = require('../../config/constants');
const notifService = require('../notifications/notifications.service');

class ApprovalsService {
  /**
   * Lấy danh sách các đơn vị mà Manager có quyền truy cập
   */
  async getAccessibleUnitIds(currentUser) {
    if (currentUser.roles.includes(ROLES.ADMIN)) {
      return null; // null nghĩa là toàn bộ hệ thống
    }

    const pool = await getPool();
    const scopesRes = await pool
      .request()
      .input('userId', sql.Int, currentUser.id)
      .query(`
        SELECT UnitId, IncludeDescendants 
        FROM UserUnitScopes 
        WHERE UserId = @userId AND (ValidTo IS NULL OR ValidTo >= CAST(SYSUTCDATETIME() AS DATE))
      `);

    const scopes = scopesRes.recordset;
    if (!scopes || scopes.length === 0) {
      return [];
    }

    const unitIds = new Set();
    for (const scope of scopes) {
      unitIds.add(scope.UnitId);
      if (scope.IncludeDescendants) {
        const childrenRes = await pool
          .request()
          .input('parentId', sql.Int, scope.UnitId)
          .query('SELECT Id FROM OrganizationUnits WHERE ParentId = @parentId');
        for (const child of childrenRes.recordset) {
          unitIds.add(child.Id);
        }
      }
    }

    return Array.from(unitIds);
  }

  /**
   * Lấy danh sách hồ sơ SUBMITTED chờ duyệt trong phạm vi quản lý
   * Quy tắc Blueprint 4: Chặn tự duyệt -> Exclude CreatedBy = currentUser.id
   */
  async getPendingApprovals(currentUser) {
    const pool = await getPool();
    const accessibleUnits = await this.getAccessibleUnitIds(currentUser);

    if (accessibleUnits !== null && accessibleUnits.length === 0) {
      return [];
    }

    const req = pool.request();
    req.input('currentUserId', sql.Int, currentUser.id);

    let unitFilter = '';
    if (accessibleUnits !== null) {
      const unitParams = accessibleUnits.map((id, idx) => {
        req.input(`unitId_${idx}`, sql.Int, id);
        return `@unitId_${idx}`;
      });
      unitFilter = `AND a.ContextUnitId IN (${unitParams.join(', ')})`;
    }

    const query = `
      SELECT 
        a.Id, a.Title, a.Description, a.RecognitionYear, a.Status, a.CreatedAt,
        a.SubmittedBy, a.ContextUnitId,
        CONVERT(VARCHAR(30), a.RowVersion, 1) AS RowVersion,
        t.Name AS TypeName, t.Category AS TypeCategory,
        u.FullName AS LecturerName,
        o.Name AS UnitName,
        co.Name AS ContextUnitName,
        (SELECT COUNT(1) FROM Evidences e WHERE e.AchievementId = a.Id) AS EvidencesCount,
        sub.SubmittedAt, sub.RevisionNo
      FROM Achievements a
      INNER JOIN AchievementTypes t ON a.AchievementTypeId = t.Id
      INNER JOIN OrganizationUnits co ON a.ContextUnitId = co.Id
      LEFT JOIN Lecturers l ON a.LecturerId = l.Id
      LEFT JOIN Users u ON l.UserId = u.Id
      LEFT JOIN OrganizationUnits o ON a.OrganizationUnitId = o.Id
      OUTER APPLY (
        SELECT TOP 1 SubmittedAt, RevisionNo 
        FROM AchievementSubmissions 
        WHERE AchievementId = a.Id 
        ORDER BY RevisionNo DESC
      ) sub
      WHERE a.Status = 'SUBMITTED'
        AND a.CreatedBy != @currentUserId
        ${unitFilter}
      ORDER BY sub.SubmittedAt ASC;
    `;

    const result = await req.query(query);
    return result.recordset;
  }

  /**
   * Lấy danh sách hồ sơ VERIFIED đã duyệt trong phạm vi quản lý
   */
  async getVerifiedAchievements(currentUser) {
    const pool = await getPool();
    const accessibleUnits = await this.getAccessibleUnitIds(currentUser);

    if (accessibleUnits !== null && accessibleUnits.length === 0) {
      return [];
    }

    const req = pool.request();
    let unitFilter = '';
    if (accessibleUnits !== null) {
      const unitParams = accessibleUnits.map((id, idx) => {
        req.input(`unitId_${idx}`, sql.Int, id);
        return `@unitId_${idx}`;
      });
      unitFilter = `AND a.ContextUnitId IN (${unitParams.join(', ')})`;
    }

    const query = `
      SELECT 
        a.Id, a.Title, a.Description, a.RecognitionYear, a.Status, a.CreatedAt,
        a.ContextUnitId,
        CONVERT(VARCHAR(30), a.RowVersion, 1) AS RowVersion,
        t.Name AS TypeName, t.Category AS TypeCategory,
        u.FullName AS LecturerName,
        o.Name AS UnitName,
        co.Name AS ContextUnitName,
        (SELECT COUNT(1) FROM Evidences e WHERE e.AchievementId = a.Id) AS EvidencesCount,
        vh.CreatedAt AS VerifiedAt,
        vu.FullName AS VerifiedByName,
        vh.Reason AS VerifiedReason
      FROM Achievements a
      INNER JOIN AchievementTypes t ON a.AchievementTypeId = t.Id
      INNER JOIN OrganizationUnits co ON a.ContextUnitId = co.Id
      LEFT JOIN Lecturers l ON a.LecturerId = l.Id
      LEFT JOIN Users u ON l.UserId = u.Id
      LEFT JOIN OrganizationUnits o ON a.OrganizationUnitId = o.Id
      OUTER APPLY (
        SELECT TOP 1 h.CreatedAt, h.ActorId, h.Reason
        FROM AchievementStatusHistories h
        WHERE h.AchievementId = a.Id AND h.ToStatus = 'VERIFIED'
        ORDER BY h.CreatedAt DESC
      ) vh
      LEFT JOIN Users vu ON vh.ActorId = vu.Id
      WHERE a.Status = 'VERIFIED'
        ${unitFilter}
      ORDER BY a.UpdatedAt DESC;
    `;

    const result = await req.query(query);
    return result.recordset;
  }

  /**
   * Helper kiểm tra tính hợp lệ của thao tác phê duyệt/xử lý
   */
  async _validateAndGetAchievement(achievementId, expectedStatus, currentUser, expectedRowVersion) {
    const pool = await getPool();
    const checkRes = await pool
      .request()
      .input('id', sql.Int, achievementId)
      .query(`
        SELECT a.Id, a.Status, a.CreatedBy, a.ContextUnitId, a.Title,
               CONVERT(VARCHAR(30), a.RowVersion, 1) AS RowVersion
        FROM Achievements a
        WHERE a.Id = @id
      `);

    const achievement = checkRes.recordset[0];
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'NOT_FOUND');
    }

    if (achievement.Status !== expectedStatus) {
      throw new AppError(
        `Thao tác không hợp lệ. Trạng thái yêu cầu: ${expectedStatus}, Trạng thái hiện tại: ${achievement.Status}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Blueprint Rule 4: Chặn tự duyệt
    if (achievement.CreatedBy === currentUser.id) {
      throw new AppError(
        'Bạn không được phép tự xử lý/phê duyệt hồ sơ thành tích do chính mình tạo (Self-Approval Rule)',
        403,
        'SELF_APPROVAL_FORBIDDEN'
      );
    }

    // Kiểm tra phạm vi quản lý
    const accessibleUnits = await this.getAccessibleUnitIds(currentUser);
    if (accessibleUnits !== null && !accessibleUnits.includes(achievement.ContextUnitId)) {
      throw new AppError(
        'Hồ sơ này nằm ngoài phạm vi đơn vị bạn được phân công quản lý',
        403,
        'OUT_OF_SCOPE'
      );
    }

    // Kiểm tra xung đột phiên bản đồng thời
    if (expectedRowVersion && achievement.RowVersion !== expectedRowVersion) {
      throw new AppError(
        'Hồ sơ đã bị thay đổi bởi người dùng khác hoặc thao tác đồng thời. Vui lòng tải lại trang.',
        409,
        'CONCURRENCY_CONFLICT'
      );
    }

    return { achievement, pool };
  }

  /**
   * Xác nhận phê duyệt: SUBMITTED -> VERIFIED
   */
  async verify(achievementId, reason, currentUser, expectedRowVersion = null) {
    const { achievement, pool } = await this._validateAndGetAchievement(
      achievementId,
      ACHIEVEMENT_STATUS.SUBMITTED,
      currentUser,
      expectedRowVersion
    );

    const subRes = await pool
      .request()
      .input('achievementId', sql.Int, achievementId)
      .query('SELECT TOP 1 Id FROM AchievementSubmissions WHERE AchievementId = @achievementId ORDER BY RevisionNo DESC');
    const submissionId = subRes.recordset[0]?.Id || null;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const updateReq = new sql.Request(transaction);
      updateReq.input('id', sql.Int, achievementId);
      await updateReq.query(`
        UPDATE Achievements 
        SET Status = 'VERIFIED', UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);

      const histReq = new sql.Request(transaction);
      histReq.input('achievementId', sql.Int, achievementId);
      histReq.input('submissionId', sql.Int, submissionId);
      histReq.input('fromStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.SUBMITTED);
      histReq.input('toStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.VERIFIED);
      histReq.input('actorId', sql.Int, currentUser.id);
      histReq.input('reason', sql.NVarChar(sql.MAX), reason || 'Hồ sơ và minh chứng số hợp lệ, đã thẩm định đạt yêu cầu.');

      await histReq.query(`
        INSERT INTO AchievementStatusHistories (AchievementId, SubmissionId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (@achievementId, @submissionId, @fromStatus, @toStatus, @actorId, @reason)
      `);

      await transaction.commit();

      try {
        await notifService.sendNotification({
          userId: achievement.CreatedBy,
          title: 'Hồ sơ thành tích được xác nhận',
          message: `Hồ sơ thành tích "${achievement.Title}" của bạn đã được xác nhận (VERIFIED).`,
          type: 'SUCCESS',
          relatedEntityType: 'ACHIEVEMENT',
          relatedEntityId: achievementId,
          actionUrl: '/achievements'
        });
      } catch (err) {
        console.error('Failed to notify owner on verify:', err);
      }

      return {
        id: achievementId,
        status: ACHIEVEMENT_STATUS.VERIFIED,
        verifiedAt: new Date().toISOString(),
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Yêu cầu bổ sung: SUBMITTED -> NEED_CORRECTION
   */
  async requestCorrection(achievementId, reason, currentUser, expectedRowVersion = null) {
    if (!reason || !reason.trim()) {
      throw new AppError('Vui lòng nhập lý do/nội dung yêu cầu bổ sung', 400, 'REASON_REQUIRED');
    }

    const { achievement, pool } = await this._validateAndGetAchievement(
      achievementId,
      ACHIEVEMENT_STATUS.SUBMITTED,
      currentUser,
      expectedRowVersion
    );

    const subRes = await pool
      .request()
      .input('achievementId', sql.Int, achievementId)
      .query('SELECT TOP 1 Id FROM AchievementSubmissions WHERE AchievementId = @achievementId ORDER BY RevisionNo DESC');
    const submissionId = subRes.recordset[0]?.Id || null;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const updateReq = new sql.Request(transaction);
      updateReq.input('id', sql.Int, achievementId);
      await updateReq.query(`
        UPDATE Achievements 
        SET Status = 'NEED_CORRECTION', UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);

      const histReq = new sql.Request(transaction);
      histReq.input('achievementId', sql.Int, achievementId);
      histReq.input('submissionId', sql.Int, submissionId);
      histReq.input('fromStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.SUBMITTED);
      histReq.input('toStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.NEED_CORRECTION);
      histReq.input('actorId', sql.Int, currentUser.id);
      histReq.input('reason', sql.NVarChar(sql.MAX), reason.trim());

      await histReq.query(`
        INSERT INTO AchievementStatusHistories (AchievementId, SubmissionId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (@achievementId, @submissionId, @fromStatus, @toStatus, @actorId, @reason)
      `);

      await transaction.commit();

      try {
        await notifService.sendNotification({
          userId: achievement.CreatedBy,
          title: 'Yêu cầu bổ sung hồ sơ thành tích',
          message: `Hồ sơ "${achievement.Title}" cần được bổ sung: "${reason.trim()}".`,
          type: 'WARNING',
          relatedEntityType: 'ACHIEVEMENT',
          relatedEntityId: achievementId,
          actionUrl: '/achievements'
        });
      } catch (err) {
        console.error('Failed to notify owner on requestCorrection:', err);
      }

      return {
        id: achievementId,
        status: ACHIEVEMENT_STATUS.NEED_CORRECTION,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Từ chối hồ sơ: SUBMITTED -> REJECTED
   */
  async reject(achievementId, reason, currentUser, expectedRowVersion = null) {
    if (!reason || !reason.trim()) {
      throw new AppError('Vui lòng nhập lý do từ chối hồ sơ', 400, 'REASON_REQUIRED');
    }

    const { achievement, pool } = await this._validateAndGetAchievement(
      achievementId,
      ACHIEVEMENT_STATUS.SUBMITTED,
      currentUser,
      expectedRowVersion
    );

    const subRes = await pool
      .request()
      .input('achievementId', sql.Int, achievementId)
      .query('SELECT TOP 1 Id FROM AchievementSubmissions WHERE AchievementId = @achievementId ORDER BY RevisionNo DESC');
    const submissionId = subRes.recordset[0]?.Id || null;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const updateReq = new sql.Request(transaction);
      updateReq.input('id', sql.Int, achievementId);
      await updateReq.query(`
        UPDATE Achievements 
        SET Status = 'REJECTED', UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);

      const histReq = new sql.Request(transaction);
      histReq.input('achievementId', sql.Int, achievementId);
      histReq.input('submissionId', sql.Int, submissionId);
      histReq.input('fromStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.SUBMITTED);
      histReq.input('toStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.REJECTED);
      histReq.input('actorId', sql.Int, currentUser.id);
      histReq.input('reason', sql.NVarChar(sql.MAX), reason.trim());

      await histReq.query(`
        INSERT INTO AchievementStatusHistories (AchievementId, SubmissionId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (@achievementId, @submissionId, @fromStatus, @toStatus, @actorId, @reason)
      `);

      await transaction.commit();

      try {
        await notifService.sendNotification({
          userId: achievement.CreatedBy,
          title: 'Hồ sơ thành tích bị từ chối',
          message: `Hồ sơ "${achievement.Title}" đã bị từ chối với lý do: "${reason.trim()}".`,
          type: 'WARNING',
          relatedEntityType: 'ACHIEVEMENT',
          relatedEntityId: achievementId,
          actionUrl: '/achievements'
        });
      } catch (err) {
        console.error('Failed to notify owner on reject:', err);
      }

      return {
        id: achievementId,
        status: ACHIEVEMENT_STATUS.REJECTED,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Thu hồi hồ sơ đã xác nhận: VERIFIED -> REVOKED
   */
  async revoke(achievementId, reason, currentUser, expectedRowVersion = null) {
    if (!reason || !reason.trim()) {
      throw new AppError('Vui lòng nhập lý do thu hồi hồ sơ đã xác nhận', 400, 'REASON_REQUIRED');
    }

    const { achievement, pool } = await this._validateAndGetAchievement(
      achievementId,
      ACHIEVEMENT_STATUS.VERIFIED,
      currentUser,
      expectedRowVersion
    );

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const updateReq = new sql.Request(transaction);
      updateReq.input('id', sql.Int, achievementId);
      await updateReq.query(`
        UPDATE Achievements 
        SET Status = 'REVOKED', UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);

      const histReq = new sql.Request(transaction);
      histReq.input('achievementId', sql.Int, achievementId);
      histReq.input('fromStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.VERIFIED);
      histReq.input('toStatus', sql.NVarChar(30), ACHIEVEMENT_STATUS.REVOKED);
      histReq.input('actorId', sql.Int, currentUser.id);
      histReq.input('reason', sql.NVarChar(sql.MAX), reason.trim());

      await histReq.query(`
        INSERT INTO AchievementStatusHistories (AchievementId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (@achievementId, @fromStatus, @toStatus, @actorId, @reason)
      `);

      await transaction.commit();

      try {
        await notifService.sendNotification({
          userId: achievement.CreatedBy,
          title: 'Hồ sơ thành tích đã bị thu hồi',
          message: `Hồ sơ "${achievement.Title}" đã bị thu hồi với giải trình: "${reason.trim()}".`,
          type: 'WARNING',
          relatedEntityType: 'ACHIEVEMENT',
          relatedEntityId: achievementId,
          actionUrl: '/achievements'
        });
      } catch (err) {
        console.error('Failed to notify owner on revoke:', err);
      }

      return {
        id: achievementId,
        status: ACHIEVEMENT_STATUS.REVOKED,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = new ApprovalsService();
