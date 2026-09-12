const orgService = require('./organizations.service');
const { success } = require('../../utils/apiResponse');

async function getUnits(req, res, next) {
  try {
    const units = await orgService.getUnits();
    return success(res, units, 'Lấy danh sách đơn vị thành công');
  } catch (err) {
    next(err);
  }
}

async function createUnit(req, res, next) {
  try {
    const unit = await orgService.createUnit(req.body);
    return success(res, unit, 'Tạo đơn vị mới thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function updateUnit(req, res, next) {
  try {
    const unit = await orgService.updateUnit(parseInt(req.params.id, 10), req.body);
    return success(res, unit, 'Cập nhật đơn vị thành công');
  } catch (err) {
    next(err);
  }
}

async function getScopes(req, res, next) {
  try {
    const scopes = await orgService.getScopes();
    return success(res, scopes, 'Lấy danh sách phân công phạm vi duyệt thành công');
  } catch (err) {
    next(err);
  }
}

async function createScope(req, res, next) {
  try {
    const scope = await orgService.createScope(req.body);
    return success(res, scope, 'Tạo phân công phạm vi duyệt thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function deleteScope(req, res, next) {
  try {
    const result = await orgService.deleteScope(parseInt(req.params.id, 10));
    return success(res, result, 'Hủy phân công phạm vi duyệt thành công');
  } catch (err) {
    next(err);
  }
}

async function getRepresentatives(req, res, next) {
  try {
    const reps = await orgService.getRepresentatives();
    return success(res, reps, 'Lấy danh sách đại diện đơn vị thành công');
  } catch (err) {
    next(err);
  }
}

async function createRepresentative(req, res, next) {
  try {
    const rep = await orgService.createRepresentative(req.body, req.user.id);
    return success(res, rep, 'Phân công đại diện đơn vị thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function deactivateRepresentative(req, res, next) {
  try {
    const rep = await orgService.deactivateRepresentative(parseInt(req.params.id, 10));
    return success(res, rep, 'Vô hiệu hóa phân công đại diện thành công');
  } catch (err) {
    next(err);
  }
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
  deactivateRepresentative
};
