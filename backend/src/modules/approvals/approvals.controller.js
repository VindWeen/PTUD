const approvalsService = require('./approvals.service');
const { success } = require('../../utils/apiResponse');

async function getPending(req, res, next) {
  try {
    const items = await approvalsService.getPendingApprovals(req.user);
    return success(res, items, 'Danh sách hồ sơ chờ xác nhận thành công');
  } catch (err) {
    next(err);
  }
}

async function getVerified(req, res, next) {
  try {
    const items = await approvalsService.getVerifiedAchievements(req.user);
    return success(res, items, 'Danh sách hồ sơ đã xác nhận thành công');
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const achievementId = parseInt(req.params.id, 10);
    const expectedRowVersion = req.body.rowVersion || req.headers['if-match'];
    const reason = req.body.reason;
    const result = await approvalsService.verify(achievementId, reason, req.user, expectedRowVersion);
    return success(res, result, 'Xác nhận phê duyệt thành tích thành công');
  } catch (err) {
    next(err);
  }
}

async function requestCorrection(req, res, next) {
  try {
    const achievementId = parseInt(req.params.id, 10);
    const expectedRowVersion = req.body.rowVersion || req.headers['if-match'];
    const reason = req.body.reason;
    const result = await approvalsService.requestCorrection(achievementId, reason, req.user, expectedRowVersion);
    return success(res, result, 'Đã gửi yêu cầu bổ sung hồ sơ thành công');
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const achievementId = parseInt(req.params.id, 10);
    const expectedRowVersion = req.body.rowVersion || req.headers['if-match'];
    const reason = req.body.reason;
    const result = await approvalsService.reject(achievementId, reason, req.user, expectedRowVersion);
    return success(res, result, 'Đã từ chối hồ sơ thành tích');
  } catch (err) {
    next(err);
  }
}

async function revoke(req, res, next) {
  try {
    const achievementId = parseInt(req.params.id, 10);
    const expectedRowVersion = req.body.rowVersion || req.headers['if-match'];
    const reason = req.body.reason;
    const result = await approvalsService.revoke(achievementId, reason, req.user, expectedRowVersion);
    return success(res, result, 'Đã thu hồi hồ sơ thành tích thành công');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPending,
  getVerified,
  verify,
  requestCorrection,
  reject,
  revoke,
};
