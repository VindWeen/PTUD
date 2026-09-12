const userService = require('./users.service');
const { success } = require('../../utils/apiResponse');

async function getUsers(req, res, next) {
  try {
    const result = await userService.getUsers(req.query);
    return success(res, result, 'Lấy danh sách người dùng thành công');
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(parseInt(req.params.id, 10));
    return success(res, user, 'Lấy thông tin người dùng thành công');
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    return success(res, user, 'Tạo người dùng thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(parseInt(req.params.id, 10), req.body);
    return success(res, user, 'Cập nhật người dùng thành công');
  } catch (err) {
    next(err);
  }
}

async function assignRoles(req, res, next) {
  try {
    const user = await userService.assignRoles(parseInt(req.params.id, 10), req.body.roleIds);
    return success(res, user, 'Cập nhật vai trò người dùng thành công');
  } catch (err) {
    next(err);
  }
}

async function getRoles(req, res, next) {
  try {
    const roles = await userService.getRoles();
    return success(res, roles, 'Lấy danh mục vai trò thành công');
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await userService.getStats();
    return success(res, stats, 'Lấy thống kê người dùng thành công');
  } catch (err) {
    next(err);
  }
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
