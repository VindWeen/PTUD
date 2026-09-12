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

async function verify(req, res, next) {
  try {
    const achievementId = parseInt(req.params.id, 10);
    const reason = req.body.reason;
    const result = await approvalsService.verify(achievementId, reason, req.user);
    return success(res, result, 'Xác nhận phê duyệt thành tích thành công');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPending,
  verify,
};
