const achievementsService = require('./achievements.service');
const { success } = require('../../utils/apiResponse');

async function create(req, res, next) {
  try {
    const result = await achievementsService.create(req.body, req.user);
    return success(res, result, 'Tạo bản nháp thành tích thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function findAll(req, res, next) {
  try {
    const result = await achievementsService.findAll(req.query, req.user);
    return success(res, result.items, 'Lấy danh sách thành tích thành công', 200, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    next(err);
  }
}

async function findById(req, res, next) {
  try {
    const result = await achievementsService.findById(req.params.id);
    return success(res, result, 'Lấy chi tiết thành tích thành công');
  } catch (err) {
    next(err);
  }
}

async function getTypes(req, res, next) {
  try {
    const pool = await require('../../config/database').getPool();
    const result = await pool
      .request()
      .query(
        'SELECT Id, Code, Name, Category, Description FROM AchievementTypes WHERE IsActive = 1 ORDER BY Category, Id'
      );
    return success(res, result.recordset, 'Danh mục loại thành tích');
  } catch (err) {
    next(err);
  }
}

async function deleteDraft(req, res, next) {
  try {
    await achievementsService.deleteDraft(req.params.id, req.user);
    return success(res, null, 'Xóa bản nháp thành tích thành công');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  findAll,
  findById,
  getTypes,
  deleteDraft,
};
