const { getPool, sql } = require('../../config/database');

/**
 * Lấy danh sách tất cả đơn vị tổ chức kèm số lượng nhân sự
 */
async function findAllUnits() {
  const pool = await getPool();
  const query = `
    SELECT 
      ou.Id, ou.Code, ou.Name, ou.Type, ou.ParentId, ou.IsActive, ou.CreatedAt,
      p.Name AS ParentName,
      (
        SELECT COUNT(DISTINCT la.LecturerId) 
        FROM LecturerAssignments la 
        WHERE la.UnitId = ou.Id
      ) AS MemberCount,
      (
        SELECT ur.Id, u.FullName, ur.ValidFrom, ur.ValidTo, ur.IsActive
        FROM UnitRepresentatives ur
        JOIN Users u ON ur.UserId = u.Id
        WHERE ur.UnitId = ou.Id AND ur.IsActive = 1
        FOR JSON PATH
      ) AS ActiveRepresentativesJson
    FROM OrganizationUnits ou
    LEFT JOIN OrganizationUnits p ON ou.ParentId = p.Id
    ORDER BY ou.Type ASC, ou.Name ASC;
  `;

  const result = await pool.request().query(query);
  return result.recordset.map(r => ({
    id: r.Id,
    code: r.Code,
    name: r.Name,
    type: r.Type,
    parentId: r.ParentId,
    parentName: r.ParentName,
    isActive: !!r.IsActive,
    createdAt: r.CreatedAt,
    memberCount: r.MemberCount,
    activeRepresentatives: r.ActiveRepresentativesJson ? JSON.parse(r.ActiveRepresentativesJson) : []
  }));
}

/**
 * Tạo mới đơn vị tổ chức
 */
async function createUnit({ code, name, type, parentId = null }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('code', sql.NVarChar(50), code)
    .input('name', sql.NVarChar(150), name)
    .input('type', sql.NVarChar(30), type)
    .input('parentId', sql.Int, parentId)
    .query(`
      INSERT INTO OrganizationUnits (Code, Name, Type, ParentId)
      OUTPUT inserted.*
      VALUES (@code, @name, @type, @parentId);
    `);

  return result.recordset[0];
}

/**
 * Cập nhật đơn vị
 */
async function updateUnit(id, { name, code, type, parentId, isActive }) {
  const pool = await getPool();
  const updates = ['UpdatedAt = SYSUTCDATETIME()'];
  const request = pool.request().input('id', sql.Int, id);

  if (name !== undefined) {
    updates.push('Name = @name');
    request.input('name', sql.NVarChar(150), name);
  }
  if (code !== undefined) {
    updates.push('Code = @code');
    request.input('code', sql.NVarChar(50), code);
  }
  if (type !== undefined) {
    updates.push('Type = @type');
    request.input('type', sql.NVarChar(30), type);
  }
  if (parentId !== undefined) {
    updates.push('ParentId = @parentId');
    request.input('parentId', sql.Int, parentId);
  }
  if (isActive !== undefined) {
    updates.push('IsActive = @isActive');
    request.input('isActive', sql.Bit, isActive);
  }

  const query = `
    UPDATE OrganizationUnits
    SET ${updates.join(', ')}
    OUTPUT inserted.*
    WHERE Id = @id;
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * Lấy danh sách phân công phạm vi duyệt hồ sơ (UserUnitScopes)
 */
async function findAllScopes() {
  const pool = await getPool();
  const query = `
    SELECT 
      s.Id, s.UserId, s.RoleId, s.UnitId, s.IncludeDescendants, s.ValidFrom, s.ValidTo, s.CreatedAt,
      u.FullName AS UserName, u.Username,
      r.Name AS RoleName, r.Code AS RoleCode,
      ou.Name AS UnitName, ou.Code AS UnitCode, ou.Type AS UnitType
    FROM UserUnitScopes s
    JOIN Users u ON s.UserId = u.Id
    JOIN Roles r ON s.RoleId = r.Id
    JOIN OrganizationUnits ou ON s.UnitId = ou.Id
    ORDER BY s.CreatedAt DESC;
  `;

  const result = await pool.request().query(query);
  return result.recordset.map(r => ({
    id: r.Id,
    userId: r.UserId,
    userName: r.UserName,
    username: r.Username,
    roleId: r.RoleId,
    roleName: r.RoleName,
    roleCode: r.RoleCode,
    unitId: r.UnitId,
    unitName: r.UnitName,
    unitCode: r.UnitCode,
    unitType: r.UnitType,
    includeDescendants: !!r.IncludeDescendants,
    validFrom: r.ValidFrom,
    validTo: r.ValidTo,
    createdAt: r.CreatedAt
  }));
}

/**
 * Tạo phân công phạm vi duyệt hồ sơ mới
 */
async function createScope({ userId, roleId, unitId, includeDescendants = true, validFrom, validTo = null }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('roleId', sql.Int, roleId)
    .input('unitId', sql.Int, unitId)
    .input('includeDescendants', sql.Bit, includeDescendants)
    .input('validFrom', sql.Date, validFrom || new Date())
    .input('validTo', sql.Date, validTo)
    .query(`
      INSERT INTO UserUnitScopes (UserId, RoleId, UnitId, IncludeDescendants, ValidFrom, ValidTo)
      OUTPUT inserted.*
      VALUES (@userId, @roleId, @unitId, @includeDescendants, @validFrom, @validTo);
    `);

  return result.recordset[0];
}

/**
 * Xóa phân công phạm vi duyệt
 */
async function deleteScope(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM UserUnitScopes WHERE Id = @id');

  return result.rowsAffected[0] > 0;
}

/**
 * Lấy danh sách đại diện đơn vị (UnitRepresentatives)
 */
async function findAllRepresentatives() {
  const pool = await getPool();
  const query = `
    SELECT 
      ur.Id, ur.UserId, ur.UnitId, ur.ValidFrom, ur.ValidTo, ur.IsActive, ur.Notes, ur.CreatedAt,
      u.FullName AS UserName, u.Username, u.Email,
      l.StaffCode,
      ou.Name AS UnitName, ou.Code AS UnitCode, ou.Type AS UnitType,
      assigner.FullName AS AssignerName
    FROM UnitRepresentatives ur
    JOIN Users u ON ur.UserId = u.Id
    LEFT JOIN Lecturers l ON u.Id = l.UserId
    JOIN OrganizationUnits ou ON ur.UnitId = ou.Id
    LEFT JOIN Users assigner ON ur.AssignedBy = assigner.Id
    ORDER BY ur.CreatedAt DESC;
  `;

  const result = await pool.request().query(query);
  return result.recordset.map(r => ({
    id: r.Id,
    userId: r.UserId,
    userName: r.UserName,
    username: r.Username,
    email: r.Email,
    staffCode: r.StaffCode,
    unitId: r.UnitId,
    unitName: r.UnitName,
    unitCode: r.UnitCode,
    unitType: r.UnitType,
    validFrom: r.ValidFrom,
    validTo: r.ValidTo,
    isActive: !!r.IsActive,
    notes: r.Notes,
    assignerName: r.AssignerName,
    createdAt: r.CreatedAt
  }));
}

/**
 * Phân công đại diện đơn vị mới
 */
async function createRepresentative({ userId, unitId, validFrom, validTo = null, assignedBy = null, notes = null }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('unitId', sql.Int, unitId)
    .input('validFrom', sql.Date, validFrom || new Date())
    .input('validTo', sql.Date, validTo)
    .input('assignedBy', sql.Int, assignedBy)
    .input('notes', sql.NVarChar(255), notes)
    .query(`
      INSERT INTO UnitRepresentatives (UserId, UnitId, ValidFrom, ValidTo, IsActive, AssignedBy, Notes)
      OUTPUT inserted.*
      VALUES (@userId, @unitId, @validFrom, @validTo, 1, @assignedBy, @notes);
    `);

  return result.recordset[0];
}

/**
 * Hủy hoặc vô hiệu hóa phân công đại diện
 */
async function deactivateRepresentative(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE UnitRepresentatives
      SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.*
      WHERE Id = @id;
    `);

  return result.recordset[0] || null;
}

/**
 * Kiểm tra tính hợp lệ của Đại diện Đơn vị cho Rule 2
 * Trả về: { isValid: boolean, reason?: string }
 */
async function checkUnitRepresentative(userId, unitId) {
  const pool = await getPool();
  
  // 1. Kiểm tra trong UnitRepresentatives
  const query = `
    SELECT TOP 1 Id, ValidFrom, ValidTo, IsActive
    FROM UnitRepresentatives
    WHERE UserId = @userId AND UnitId = @unitId
    ORDER BY CreatedAt DESC;
  `;

  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('unitId', sql.Int, unitId)
    .query(query);

  if (result.recordset.length > 0) {
    const rep = result.recordset[0];
    if (!rep.IsActive) {
      return { isValid: false, reason: 'REPRESENTATIVE_INACTIVE', message: 'Phân công đại diện cho đơn vị này đã bị vô hiệu hóa.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validFrom = new Date(rep.ValidFrom);
    validFrom.setHours(0, 0, 0, 0);

    if (today < validFrom) {
      return { isValid: false, reason: 'REPRESENTATIVE_NOT_YET_VALID', message: 'Thời hạn phân công đại diện chưa bắt đầu.' };
    }

    if (rep.ValidTo) {
      const validTo = new Date(rep.ValidTo);
      validTo.setHours(23, 59, 59, 999);
      if (today > validTo) {
        return { isValid: false, reason: 'REPRESENTATIVE_EXPIRED', message: 'Thời hạn phân công đại diện cho đơn vị này đã hết hạn.' };
      }
    }

    return { isValid: true };
  }

  // 2. Kiểm tra xem user có phải là Manager của đơn vị đó không (hoặc Admin)
  const managerQuery = `
    SELECT TOP 1 s.Id
    FROM UserUnitScopes s
    WHERE s.UserId = @userId AND s.UnitId = @unitId
      AND (s.ValidTo IS NULL OR s.ValidTo >= CAST(SYSUTCDATETIME() AS DATE))
      AND s.ValidFrom <= CAST(SYSUTCDATETIME() AS DATE);
  `;
  const managerResult = await pool.request()
    .input('userId', sql.Int, userId)
    .input('unitId', sql.Int, unitId)
    .query(managerQuery);

  if (managerResult.recordset.length > 0) {
    return { isValid: true, isManager: true };
  }

  return { 
    isValid: false, 
    reason: 'NOT_REPRESENTATIVE', 
    message: 'Người dùng không được phân công làm đại diện kê khai thành tích cho đơn vị này.' 
  };
}

module.exports = {
  findAllUnits,
  createUnit,
  updateUnit,
  findAllScopes,
  createScope,
  deleteScope,
  findAllRepresentatives,
  createRepresentative,
  deactivateRepresentative,
  checkUnitRepresentative
};
