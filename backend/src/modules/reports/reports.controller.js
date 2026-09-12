const reportsService = require('./reports.service');
const { success } = require('../../utils/apiResponse');

async function getDashboardSummary(req, res, next) {
  try {
    const summary = await reportsService.getDashboardSummary(req.user, req.query);
    return success(res, summary, 'Lấy dữ liệu tổng hợp Dashboard thành công');
  } catch (err) {
    next(err);
  }
}

async function getAchievementsReport(req, res, next) {
  try {
    const report = await reportsService.getAchievementsReport(req.query);
    return success(res, report, 'Lấy báo cáo thành tích thành công');
  } catch (err) {
    next(err);
  }
}

async function getAwardsReport(req, res, next) {
  try {
    const report = await reportsService.getAwardsReport(req.query);
    return success(res, report, 'Lấy báo cáo khen thưởng thành công');
  } catch (err) {
    next(err);
  }
}

async function exportCsv(req, res, next) {
  try {
    const { type = 'achievements', year, unitId, status } = req.query;
    const { filename, content } = await reportsService.exportCsv(type, { year, unitId, status });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(content);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary,
  getAchievementsReport,
  getAwardsReport,
  exportCsv
};
