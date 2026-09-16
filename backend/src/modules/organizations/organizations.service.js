const orgRepo = require('./organizations.repository');
const notifService = require('../notifications/notifications.service');
const auditService = require('../audit/audit.service');

/**
 * Lấy danh sách đơn vị tổ chức
 */
async function getUnits() {
  return await orgRepo.findAllUnits();
}

/**
 * Tạo mới đơn vị
 */
async function createUnit(data) {
  const { code, name, type, parentId } = data;
  if (!code || !name || !type) {
    const error = new Error('Mã đơn vị, tên đơn vị và loại đơn vị là bắt buộc.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }
  return await orgRepo.createUnit({ code, name, type, parentId });
}

/**
 * Cập nhật đơn vị
 */
async function updateUnit(id, data) {
  const updated = await orgRepo.updateUnit(id, data);
  if (!updated) {
    const error = new Error('Đơn vị không tồn tại.');
    error.statusCode = 404;
    error.errorCode = 'UNIT_NOT_FOUND';
    throw error;
  }
  return updated;
}

/**
 * Lấy danh sách phân công phạm vi duyệt
 */
async function getScopes() {
  return await orgRepo.findAllScopes();
}

/**
 * Tạo phân công phạm vi duyệt mới
 */
async function createScope(data) {
  const { userId, roleId, unitId, includeDescendants, validFrom, validTo } = data;
  if (!userId || !roleId || !unitId) {
    const error = new Error('UserId, RoleId và UnitId là bắt buộc.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const scope = await orgRepo.createScope({
    userId,
    roleId,
    unitId,
    includeDescendants,
    validFrom,
    validTo
  });

  // Gửi thông báo cho Manager được phân công
  await notifService.sendNotification({
    userId,
    title: 'Phân công Thẩm định Hồ sơ',
    message: `Bạn vừa được phân công phạm vi thẩm định hồ sơ cho đơn vị ID: ${unitId}.`,
    type: 'INFO',
    relatedEntityType: 'ASSIGNMENT',
    actionUrl: '/approvals'
  });

  await auditService.log({
    userId: null,
    action: 'SCOPE_ASSIGN',
    entityType: 'SCOPE',
    entityId: scope.id || scope.Id,
    oldValues: null,
    newValues: { userId, roleId, unitId, includeDescendants, validFrom, validTo },
  });

  return scope;
}

/**
 * Xóa phân công phạm vi duyệt
 */
async function deleteScope(id) {
  const success = await orgRepo.deleteScope(id);
  if (!success) {
    const error = new Error('Phân công phạm vi duyệt không tồn tại.');
    error.statusCode = 404;
    error.errorCode = 'SCOPE_NOT_FOUND';
    throw error;
  }

  await auditService.log({
    userId: null,
    action: 'SCOPE_DELETE',
    entityType: 'SCOPE',
    entityId: id,
    oldValues: { id },
    newValues: null,
  });

  return { id, deleted: true };
}

/**
 * Lấy danh sách đại diện đơn vị
 */
async function getRepresentatives() {
  return await orgRepo.findAllRepresentatives();
}

/**
 * Phân công đại diện đơn vị mới
 */
async function createRepresentative(data, assignedBy) {
  const { userId, unitId, validFrom, validTo, notes } = data;
  if (!userId || !unitId) {
    const error = new Error('UserId và UnitId là bắt buộc.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const rep = await orgRepo.createRepresentative({
    userId,
    unitId,
    validFrom,
    validTo,
    assignedBy,
    notes
  });

  // Gửi thông báo cho Giảng viên được phân công làm đại diện
  await notifService.sendNotification({
    userId,
    title: 'Phân công Đại diện Đơn vị',
    message: `Bạn đã được phân công làm Đại diện kê khai thành tích tập thể cho đơn vị ID: ${unitId}.`,
    type: 'INFO',
    relatedEntityType: 'ASSIGNMENT',
    actionUrl: '/achievements'
  });

  await auditService.log({
    userId: assignedBy || null,
    action: 'REPRESENTATIVE_ASSIGN',
    entityType: 'REPRESENTATIVE',
    entityId: rep.id || rep.Id,
    oldValues: null,
    newValues: { userId, unitId, validFrom, validTo, notes },
  });

  return rep;
}

/**
 * Vô hiệu hóa phân công đại diện
 */
async function deactivateRepresentative(id) {
  const updated = await orgRepo.deactivateRepresentative(id);
  if (!updated) {
    const error = new Error('Phân công đại diện không tồn tại.');
    error.statusCode = 404;
    error.errorCode = 'REPRESENTATIVE_NOT_FOUND';
    throw error;
  }

  await auditService.log({
    userId: null,
    action: 'REPRESENTATIVE_DEACTIVATE',
    entityType: 'REPRESENTATIVE',
    entityId: id,
    oldValues: { id, isActive: 1 },
    newValues: { id, isActive: 0 },
  });

  return updated;
}

/**
 * Kiểm tra tính hợp lệ của Đại diện Đơn vị (Rule 2 Blueprint)
 */
async function validateUnitRepresentative(userId, unitId) {
  return await orgRepo.checkUnitRepresentative(userId, unitId);
}

module.exports = {
  getUnits,
  createUnit,
  updateUnit,
  getScopes,
  createScope,
  deleteScope,
  getRepresentatives,
  createRepresentative,
  deactivateRepresentative,
  validateUnitRepresentative
};
