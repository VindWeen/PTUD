const achievementsRepository = require('./achievements.repository');
const { getPool, sql } = require('../../config/database');
const AppError = require('../../utils/appError');
const { ACHIEVEMENT_STATUS, ROLES } = require('../../config/constants');

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
}

module.exports = new AchievementsService();
