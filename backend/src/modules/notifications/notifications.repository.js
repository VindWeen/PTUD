const { getPool, sql } = require('../../config/database');

/**
 * Lấy danh sách thông báo của một người dùng (phân trang)
 */
async function findUserNotifications({ userId, isRead = null, page = 1, pageSize = 20 }) {
  const pool = await getPool();
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE UserId = @userId';
  if (isRead !== null && isRead !== undefined) {
    whereClause += ' AND IsRead = @isRead';
  }

  const query = `
    SELECT 
      Id, UserId, Title, Message, Type, 
      RelatedEntityType, RelatedEntityId, ActionUrl, 
      IsRead, ReadAt, CreatedAt,
      COUNT(1) OVER() AS TotalCount
    FROM Notifications
    ${whereClause}
    ORDER BY CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `;

  const request = pool.request()
    .input('userId', sql.Int, userId)
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, pageSize);

  if (isRead !== null && isRead !== undefined) {
    request.input('isRead', sql.Bit, isRead);
  }

  const result = await request.query(query);
  const items = result.recordset;
  const total = items.length > 0 ? items[0].TotalCount : 0;

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Đếm số lượng thông báo chưa đọc của user
 */
async function countUnreadNotifications(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT COUNT(1) AS UnreadCount
      FROM Notifications
      WHERE UserId = @userId AND IsRead = 0;
    `);

  return result.recordset[0]?.UnreadCount || 0;
}

/**
 * Đánh dấu một thông báo là đã đọc
 */
async function markNotificationAsRead(id, userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE Notifications
      SET IsRead = 1, ReadAt = SYSUTCDATETIME()
      OUTPUT inserted.*
      WHERE Id = @id AND UserId = @userId;
    `);

  return result.recordset[0] || null;
}

/**
 * Đánh dấu tất cả thông báo của user là đã đọc
 */
async function markAllNotificationsAsRead(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE Notifications
      SET IsRead = 1, ReadAt = SYSUTCDATETIME()
      WHERE UserId = @userId AND IsRead = 0;
    `);

  return result.rowsAffected[0] || 0;
}

/**
 * Tạo mới thông báo
 */
async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl = null
}) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('title', sql.NVarChar(200), title)
    .input('message', sql.NVarChar(sql.MAX), message)
    .input('type', sql.NVarChar(50), type)
    .input('relatedEntityType', sql.NVarChar(50), relatedEntityType)
    .input('relatedEntityId', sql.Int, relatedEntityId)
    .input('actionUrl', sql.NVarChar(255), actionUrl)
    .query(`
      INSERT INTO Notifications (
        UserId, Title, Message, Type, 
        RelatedEntityType, RelatedEntityId, ActionUrl
      )
      OUTPUT inserted.*
      VALUES (
        @userId, @title, @message, @type, 
        @relatedEntityType, @relatedEntityId, @actionUrl
      );
    `);

  return result.recordset[0];
}

/**
 * Tạo thông báo hàng loạt cho danh sách UserIds
 */
async function createBatchNotifications({
  userIds,
  title,
  message,
  type = 'INFO',
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl = null
}) {
  if (!userIds || userIds.length === 0) return [];

  const createdNotifications = [];
  for (const uid of userIds) {
    const notif = await createNotification({
      userId: uid,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
      actionUrl
    });
    createdNotifications.push(notif);
  }

  return createdNotifications;
}

module.exports = {
  findUserNotifications,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  createBatchNotifications
};
