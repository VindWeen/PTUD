const notifService = require('./notifications.service');
const { success } = require('../../utils/apiResponse');

async function getNotifications(req, res, next) {
  try {
    const result = await notifService.getUserNotifications(req.user.id, req.query);
    return success(res, result, 'Lấy danh sách thông báo thành công');
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notifService.getUnreadCount(req.user.id);
    return success(res, { unreadCount: count }, 'Lấy số lượng thông báo chưa đọc thành công');
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notifId = parseInt(req.params.id, 10);
    const result = await notifService.markAsRead(notifId, req.user.id);
    return success(res, result, 'Đã đánh dấu thông báo là đã đọc');
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notifService.markAllAsRead(req.user.id);
    return success(res, result, 'Đã đánh dấu tất cả thông báo là đã đọc');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
