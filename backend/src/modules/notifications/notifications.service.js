const notifRepo = require('./notifications.repository');
const { getPool, sql } = require('../../config/database');

/**
 * Lấy danh sách thông báo của người dùng kèm phân trang và tổng chưa đọc
 */
async function getUserNotifications(userId, queryParams = {}) {
  const { page = 1, pageSize = 20, isRead } = queryParams;
  
  let parsedIsRead = null;
  if (isRead === 'true' || isRead === true) parsedIsRead = true;
  if (isRead === 'false' || isRead === false) parsedIsRead = false;

  const result = await notifRepo.findUserNotifications({
    userId,
    isRead: parsedIsRead,
    page: parseInt(page, 10) || 1,
    pageSize: parseInt(pageSize, 10) || 20
  });

  const unreadCount = await notifRepo.countUnreadNotifications(userId);

  return {
    ...result,
    unreadCount
  };
}

/**
 * Lấy số lượng thông báo chưa đọc
 */
async function getUnreadCount(userId) {
  return await notifRepo.countUnreadNotifications(userId);
}

/**
 * Đánh dấu đã đọc một thông báo
 */
async function markAsRead(id, userId) {
  const notif = await notifRepo.markNotificationAsRead(id, userId);
  if (!notif) {
    const error = new Error('Thông báo không tồn tại hoặc không thuộc về người dùng.');
    error.statusCode = 404;
    error.errorCode = 'NOTIFICATION_NOT_FOUND';
    throw error;
  }
  return notif;
}

/**
 * Đánh dấu đã đọc tất cả
 */
async function markAllAsRead(userId) {
  const count = await notifRepo.markAllNotificationsAsRead(userId);
  return { updatedCount: count };
}

/**
 * Gửi thông báo cho một người dùng
 */
async function sendNotification({
  userId,
  title,
  message,
  type = 'INFO',
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl = null
}) {
  return await notifRepo.createNotification({
    userId,
    title,
    message,
    type,
    relatedEntityType,
    relatedEntityId,
    actionUrl
  });
}

/**
 * Tự động tìm kiếm các Cán bộ quản lý (Manager) có UserUnitScopes bao phủ đơn vị UnitId
 * và gửi thông báo cho họ khi có hồ sơ mới được nộp
 */
async function notifyUnitManagers({
  unitId,
  excludeUserId = null,
  title,
  message,
  type = 'ACTION_REQUIRED',
  relatedEntityType = 'ACHIEVEMENT',
  relatedEntityId = null,
  actionUrl = '/approvals'
}) {
  try {
    const pool = await getPool();
    // Lấy danh sách manager phụ trách đơn vị trực tiếp hoặc đơn vị cha với IncludeDescendants = 1
    const query = `
      WITH UnitHierarchy AS (
        SELECT Id, ParentId, 0 AS Level
        FROM OrganizationUnits
        WHERE Id = @unitId
        UNION ALL
        SELECT u.Id, u.ParentId, uh.Level + 1
        FROM OrganizationUnits u
        INNER JOIN UnitHierarchy uh ON u.Id = uh.ParentId
      )
      SELECT DISTINCT s.UserId
      FROM UserUnitScopes s
      INNER JOIN UnitHierarchy uh ON s.UnitId = uh.Id
      WHERE (uh.Level = 0 OR s.IncludeDescendants = 1)
        AND (s.ValidTo IS NULL OR s.ValidTo >= CAST(SYSUTCDATETIME() AS DATE))
        AND s.ValidFrom <= CAST(SYSUTCDATETIME() AS DATE);
    `;

    const result = await pool.request()
      .input('unitId', sql.Int, unitId)
      .query(query);

    const userIds = result.recordset
      .map(r => r.UserId)
      .filter(uid => uid !== excludeUserId);

    if (userIds.length > 0) {
      await notifRepo.createBatchNotifications({
        userIds,
        title,
        message,
        type,
        relatedEntityType,
        relatedEntityId,
        actionUrl
      });
    }

    return userIds;
  } catch (err) {
    console.error('Error notifying unit managers:', err);
    return [];
  }
}

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendNotification,
  notifyUnitManagers
};
