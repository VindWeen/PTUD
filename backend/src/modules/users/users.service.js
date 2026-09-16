const bcrypt = require('bcryptjs');
const userRepo = require('./users.repository');
const auditService = require('../audit/audit.service');

/**
 * Lấy danh sách người dùng
 */
async function getUsers(query) {
  const { keyword, roleCode, isActive, page = 1, pageSize = 20 } = query;

  let parsedIsActive = null;
  if (isActive === 'true' || isActive === true) parsedIsActive = true;
  if (isActive === 'false' || isActive === false) parsedIsActive = false;

  return await userRepo.findAllUsers({
    keyword,
    roleCode,
    isActive: parsedIsActive,
    page: parseInt(page, 10) || 1,
    pageSize: parseInt(pageSize, 10) || 20
  });
}

/**
 * Lấy chi tiết một người dùng
 */
async function getUserById(id) {
  const user = await userRepo.findUserById(id);
  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }
  return user;
}

/**
 * Tạo người dùng mới
 */
async function createUser(userData) {
  const {
    username,
    email,
    password = 'User@123456',
    fullName,
    avatarUrl = null,
    isActive = true,
    roleIds = [],
    isLecturer = false,
    staffCode,
    academicTitle = null,
    academicDegree = null,
    position = null
  } = userData;

  if (!username || !email || !fullName) {
    const error = new Error('Tên đăng nhập, email và họ tên là bắt buộc.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Tạo User
  const newUser = await userRepo.createUser({
    username,
    email,
    passwordHash,
    fullName,
    avatarUrl,
    isActive
  });

  // Nếu có vai trò được chỉ định
  if (roleIds && roleIds.length > 0) {
    await userRepo.setUserRoles(newUser.Id, roleIds);
  }

  // Nếu có thông tin giảng viên
  if (isLecturer || staffCode) {
    await userRepo.createLecturerProfile({
      userId: newUser.Id,
      staffCode: staffCode || `GV_${newUser.Id}`,
      academicTitle,
      academicDegree,
      position
    });
  }

  const created = await userRepo.findUserById(newUser.Id);

  await auditService.log({
    userId: null,
    action: 'USER_CREATE',
    entityType: 'USER',
    entityId: newUser.Id,
    oldValues: null,
    newValues: { username, email, fullName, roleIds, isLecturer },
  });

  return created;
}

/**
 * Cập nhật người dùng
 */
async function updateUser(id, updateData) {
  const existing = await userRepo.findUserById(id);
  if (!existing) {
    const error = new Error('Người dùng không tồn tại.');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  const { fullName, email, avatarUrl, isActive, roleIds } = updateData;

  const updated = await userRepo.updateUser(id, {
    fullName,
    email,
    avatarUrl,
    isActive
  });

  if (roleIds && Array.isArray(roleIds)) {
    await userRepo.setUserRoles(id, roleIds);
  }

  const result = await userRepo.findUserById(id);

  await auditService.log({
    userId: null,
    action: 'USER_UPDATE',
    entityType: 'USER',
    entityId: id,
    oldValues: { fullName: existing.FullName, email: existing.Email, isActive: existing.IsActive },
    newValues: { fullName, email, isActive, roleIds },
  });

  return result;
}

/**
 * Phân quyền vai trò
 */
async function assignRoles(id, roleIds) {
  const existing = await userRepo.findUserById(id);
  if (!existing) {
    const error = new Error('Người dùng không tồn tại.');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  if (!Array.isArray(roleIds)) {
    const error = new Error('Danh sách vai trò không hợp lệ.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_ROLES';
    throw error;
  }

  await userRepo.setUserRoles(id, roleIds);
  const result = await userRepo.findUserById(id);

  await auditService.log({
    userId: null,
    action: 'ROLE_ASSIGN',
    entityType: 'USER',
    entityId: id,
    oldValues: null,
    newValues: { roleIds },
  });

  return result;
}

/**
 * Lấy danh mục vai trò
 */
async function getRoles() {
  return await userRepo.getAllRoles();
}

/**
 * Lấy thống kê người dùng
 */
async function getStats() {
  return await userRepo.getUsersStats();
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  assignRoles,
  getRoles,
  getStats
};
