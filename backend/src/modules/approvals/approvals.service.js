const { getPool, sql } = require('../../config/database');
const AppError = require('../../utils/appError');
const { ACHIEVEMENT_STATUS, ROLES } = require('../../config/constants');

class ApprovalsService {
  /**
   * Lấy danh sách các đơn vị mà Manager có quyền truy cập
   */
  async getAccessibleUnitIds(currentUser) {
    // Nếu là Admin, có quyền xem tất cả đơn vị
    if (currentUser.roles.includes(ROLES.ADMIN)) {
      return null; // null nghĩa là toàn bộ hệ thống
    }

    const pool = await getPool();
    // Lấy phạm vi phân công của user
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
        // Lấy tất cả bộ môn con của Khoa
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

    // Nếu không có phạm vi nào, trả về rỗng
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
   * Xác nhận phê duyệt thành tích: SUBMITTED -> VERIFIED
   * Quy tắc Blueprint 4 & 5: Chặn tự duyệt, khóa hồ sơ, ghi nhận lịch sử
   */
  async verify(achievementId, reason, currentUser) {
    const pool = await getPool();

    // 1. Kiểm tra tồn tại của Achievement
    const checkRes = await pool
      .request()
      .input('id', sql.Int, achievementId)
      .query(`
        SELECT a.Id, a.Status, a.CreatedBy, a.ContextUnitId, a.Title
        FROM Achievements a
        WHERE a.Id = @id
      `);

    const achievement = checkRes.recordset[0];
    if (!achievement) {
      throw new AppError('Không tìm thấy hồ sơ thành tích', 404, 'NOT_FOUND');
    }

    if (achievement.Status !== ACHIEVEMENT_STATUS.SUBMITTED) {
      throw new AppError(
        `Chỉ có thể phê duyệt hồ sơ đang ở trạng thái Chờ duyệt (SUBMITTED). Hồ sơ hiện tại: ${achievement.Status}`,
        400,
        'INVALID_STATUS_FOR_VERIFY'
      );
    }

    // Blueprint Rule 4: Chặn tự duyệt
    if (achievement.CreatedBy === currentUser.id) {
      throw new AppError(
        'Bạn không được phép tự phê duyệt hồ sơ thành tích do chính mình tạo (Self-Approval Rule)',
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

    // Lấy submission ID mới nhất
    const subRes = await pool
      .request()
      .input('achievementId', sql.Int, achievementId)
      .query('SELECT TOP 1 Id FROM AchievementSubmissions WHERE AchievementId = @achievementId ORDER BY RevisionNo DESC');
    const submissionId = subRes.recordset[0]?.Id || null;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Cập nhật trạng thái thành tích
      const updateReq = new sql.Request(transaction);
      updateReq.input('id', sql.Int, achievementId);
      await updateReq.query(`
        UPDATE Achievements 
        SET Status = 'VERIFIED', UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);

      // Ghi vết lịch sử trạng thái
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
}

module.exports = new ApprovalsService();
