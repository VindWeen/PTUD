const { getPool, sql } = require('../../config/database');

/**
 * Lấy danh sách người dùng kèm vai trò, thông tin giảng viên và đơn vị (phân trang)
 */
async function findAllUsers({ keyword, roleCode, isActive, page = 1, pageSize = 20 }) {
  const pool = await getPool();
  const offset = (page - 1) * pageSize;

  let whereClauses = ['1=1'];
  if (keyword) {
    whereClauses.push('(u.Username LIKE @keyword OR u.FullName LIKE @keyword OR u.Email LIKE @keyword OR l.StaffCode LIKE @keyword)');
  }
  if (roleCode) {
    whereClauses.push('EXISTS (SELECT 1 FROM UserRoles ur JOIN Roles r ON ur.RoleId = r.Id WHERE ur.UserId = u.Id AND r.Code = @roleCode)');
  }
  if (isActive !== null && isActive !== undefined) {
    whereClauses.push('u.IsActive = @isActive');
  }

  const query = `
    WITH UserList AS (
      SELECT 
        u.Id, u.Username, u.Email, u.FullName, u.AvatarUrl, u.IsActive, u.CreatedAt, u.UpdatedAt,
        l.StaffCode, l.AcademicTitle, l.AcademicDegree, l.Position,
        (
          SELECT r.Id, r.Code, r.Name
          FROM UserRoles ur
          JOIN Roles r ON ur.RoleId = r.Id
          WHERE ur.UserId = u.Id
          FOR JSON PATH
        ) AS RolesJson,
        (
          SELECT ou.Id, ou.Code, ou.Name, ou.Type
          FROM LecturerAssignments la
          JOIN OrganizationUnits ou ON la.UnitId = ou.Id
          WHERE la.LecturerId = l.Id AND la.IsPrimary = 1
          FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ) AS PrimaryUnitJson,
        COUNT(1) OVER() AS TotalCount
      FROM Users u
      LEFT JOIN Lecturers l ON u.Id = l.UserId
      WHERE ${whereClauses.join(' AND ')}
    )
    SELECT *
    FROM UserList
    ORDER BY CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `;

  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, pageSize);

  if (keyword) {
    request.input('keyword', sql.NVarChar(100), `%${keyword}%`);
  }
  if (roleCode) {
    request.input('roleCode', sql.NVarChar(50), roleCode);
  }
  if (isActive !== null && isActive !== undefined) {
    request.input('isActive', sql.Bit, isActive);
  }

  const result = await request.query(query);
  const items = result.recordset.map(row => ({
    id: row.Id,
    username: row.Username,
    email: row.Email,
    fullName: row.FullName,
    avatarUrl: row.AvatarUrl,
    isActive: !!row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    staffCode: row.StaffCode,
    academicTitle: row.AcademicTitle,
    academicDegree: row.AcademicDegree,
    position: row.Position,
    roles: row.RolesJson ? JSON.parse(row.RolesJson) : [],
    primaryUnit: row.PrimaryUnitJson ? JSON.parse(row.PrimaryUnitJson) : null
  }));

  const total = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Tìm user theo Id
 */
async function findUserById(id) {
  const pool = await getPool();
  const query = `
    SELECT 
      u.Id, u.Username, u.Email, u.FullName, u.AvatarUrl, u.IsActive, u.CreatedAt, u.UpdatedAt,
      l.StaffCode, l.AcademicTitle, l.AcademicDegree, l.Position,
      (
        SELECT r.Id, r.Code, r.Name
        FROM UserRoles ur
        JOIN Roles r ON ur.RoleId = r.Id
        WHERE ur.UserId = u.Id
        FOR JSON PATH
      ) AS RolesJson
    FROM Users u
    LEFT JOIN Lecturers l ON u.Id = l.UserId
    WHERE u.Id = @id;
  `;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(query);

  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];
  return {
    id: row.Id,
    username: row.Username,
    email: row.Email,
    fullName: row.FullName,
    avatarUrl: row.AvatarUrl,
    isActive: !!row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    staffCode: row.StaffCode,
    academicTitle: row.AcademicTitle,
    academicDegree: row.AcademicDegree,
    position: row.Position,
    roles: row.RolesJson ? JSON.parse(row.RolesJson) : []
  };
}

/**
 * Tạo mới người dùng
 */
async function createUser({ username, email, passwordHash, fullName, avatarUrl = null, isActive = true }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('username', sql.NVarChar(50), username)
    .input('email', sql.NVarChar(100), email)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('fullName', sql.NVarChar(100), fullName)
    .input('avatarUrl', sql.NVarChar(255), avatarUrl)
    .input('isActive', sql.Bit, isActive)
    .query(`
      INSERT INTO Users (Username, Email, PasswordHash, FullName, AvatarUrl, IsActive)
      OUTPUT inserted.Id, inserted.Username, inserted.Email, inserted.FullName, inserted.IsActive, inserted.CreatedAt
      VALUES (@username, @email, @passwordHash, @fullName, @avatarUrl, @isActive);
    `);

  return result.recordset[0];
}

/**
 * Tạo hồ sơ Giảng viên kèm theo
 */
async function createLecturerProfile({ userId, staffCode, academicTitle = null, academicDegree = null, position = null }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('staffCode', sql.NVarChar(50), staffCode)
    .input('academicTitle', sql.NVarChar(50), academicTitle)
    .input('academicDegree', sql.NVarChar(50), academicDegree)
    .input('position', sql.NVarChar(100), position)
    .query(`
      INSERT INTO Lecturers (UserId, StaffCode, AcademicTitle, AcademicDegree, Position)
      OUTPUT inserted.*
      VALUES (@userId, @staffCode, @academicTitle, @academicDegree, @position);
    `);

  return result.recordset[0];
}

/**
 * Gán danh sách vai trò cho người dùng
 */
async function setUserRoles(userId, roleIds) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // Xóa vai trò hiện tại
    await transaction.request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM UserRoles WHERE UserId = @userId');

    // Thêm các vai trò mới
    for (const rId of roleIds) {
      await transaction.request()
        .input('userId', sql.Int, userId)
        .input('roleId', sql.Int, rId)
        .query('INSERT INTO UserRoles (UserId, RoleId) VALUES (@userId, @roleId)');
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Cập nhật thông tin cơ bản hoặc trạng thái hoạt động
 */
async function updateUser(id, { fullName, email, avatarUrl, isActive }) {
  const pool = await getPool();
  const updates = ['UpdatedAt = SYSUTCDATETIME()'];
  const request = pool.request().input('id', sql.Int, id);

  if (fullName !== undefined) {
    updates.push('FullName = @fullName');
    request.input('fullName', sql.NVarChar(100), fullName);
  }
  if (email !== undefined) {
    updates.push('Email = @email');
    request.input('email', sql.NVarChar(100), email);
  }
  if (avatarUrl !== undefined) {
    updates.push('AvatarUrl = @avatarUrl');
    request.input('avatarUrl', sql.NVarChar(255), avatarUrl);
  }
  if (isActive !== undefined) {
    updates.push('IsActive = @isActive');
    request.input('isActive', sql.Bit, isActive);
  }

  const query = `
    UPDATE Users
    SET ${updates.join(', ')}
    OUTPUT inserted.Id, inserted.Username, inserted.Email, inserted.FullName, inserted.IsActive, inserted.UpdatedAt
    WHERE Id = @id;
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * Lấy tất cả danh mục vai trò
 */
async function getAllRoles() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT Id, Code, Name, Description, IsActive FROM Roles ORDER BY Id ASC');
  return result.recordset;
}

/**
 * Thống kê tổng hợp số lượng người dùng theo vai trò
 */
async function getUsersStats() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT 
      (SELECT COUNT(1) FROM Users) AS TotalUsers,
      (SELECT COUNT(1) FROM Users WHERE IsActive = 1) AS ActiveUsers,
      (SELECT COUNT(1) FROM Lecturers) AS TotalLecturers,
      (SELECT COUNT(DISTINCT UserId) FROM UserRoles ur JOIN Roles r ON ur.RoleId = r.Id WHERE r.Code = 'MANAGER') AS TotalManagers,
      (SELECT COUNT(1) FROM UnitRepresentatives WHERE IsActive = 1) AS ActiveRepresentatives
  `);
  return result.recordset[0];
}

module.exports = {
  findAllUsers,
  findUserById,
  createUser,
  createLecturerProfile,
  setUserRoles,
  updateUser,
  getAllRoles,
  getUsersStats
};
