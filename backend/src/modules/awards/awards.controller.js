const awardsService = require('./awards.service');
const { success } = require('../../utils/apiResponse');

async function getTypes(req, res, next) {
  try {
    const types = await awardsService.getTypes();
    return success(res, types, 'Danh mục loại khen thưởng');
  } catch (err) {
    next(err);
  }
}

async function getDecisions(req, res, next) {
  try {
    const decisions = await awardsService.getDecisions(req.query.search);
    return success(res, decisions, 'Danh sách quyết định khen thưởng');
  } catch (err) {
    next(err);
  }
}

async function getDecisionById(req, res, next) {
  try {
    const decision = await awardsService.findDecisionById(parseInt(req.params.id, 10));
    return success(res, decision, 'Chi tiết quyết định khen thưởng');
  } catch (err) {
    next(err);
  }
}

async function createDecision(req, res, next) {
  try {
    const decision = await awardsService.createDecision(req.body, req.file, req.user);
    return success(res, decision, 'Tạo quyết định khen thưởng thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function findAllRecords(req, res, next) {
  try {
    const result = await awardsService.findAllRecords(req.query, req.user);
    return success(res, result.items, 'Danh sách bản ghi khen thưởng', 200, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    next(err);
  }
}

async function findRecordById(req, res, next) {
  try {
    const record = await awardsService.findRecordById(parseInt(req.params.id, 10));
    return success(res, record, 'Chi tiết bản ghi khen thưởng');
  } catch (err) {
    next(err);
  }
}

async function createRecord(req, res, next) {
  try {
    const result = await awardsService.createRecord(req.body, req.user);
    return success(res, result, 'Ghi nhận kết quả khen thưởng thành công', 201);
  } catch (err) {
    next(err);
  }
}

async function updateRecord(req, res, next) {
  try {
    const expectedRowVersion = req.body.rowVersion || req.headers['if-match'];
    const result = await awardsService.updateRecord(parseInt(req.params.id, 10), req.body, req.user, expectedRowVersion);
    return success(res, result, 'Cập nhật bản ghi khen thưởng thành công');
  } catch (err) {
    next(err);
  }
}

async function recordAward(req, res, next) {
  try {
    const expectedRowVersion = req.body.rowVersion || req.headers['if-match'];
    const result = await awardsService.recordAward(parseInt(req.params.id, 10), req.user, expectedRowVersion);
    return success(res, result, 'Chính thức ghi nhận kết quả khen thưởng thành công');
  } catch (err) {
    next(err);
  }
}

async function revokeAward(req, res, next) {
  try {
    const expectedRowVersion = req.body.rowVersion || req.headers['if-match'];
    const reason = req.body.reason;
    const result = await awardsService.revokeAward(parseInt(req.params.id, 10), reason, req.user, expectedRowVersion);
    return success(res, result, 'Thu hồi kết quả khen thưởng thành công');
  } catch (err) {
    next(err);
  }
}

async function getRecordHistory(req, res, next) {
  try {
    const history = await awardsService.getRecordHistory(parseInt(req.params.id, 10));
    return success(res, history, 'Lịch sử bản ghi khen thưởng');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTypes,
  getDecisions,
  getDecisionById,
  createDecision,
  findAllRecords,
  findRecordById,
  createRecord,
  updateRecord,
  recordAward,
  revokeAward,
  getRecordHistory,
};
