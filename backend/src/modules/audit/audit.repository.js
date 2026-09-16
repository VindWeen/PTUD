const { getPool, sql } = require('../../config/database');

class AuditRepository {
  async createLog({ userId, action, entityType, entityId, oldValues, newValues, ipAddress }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId || null)
      .input('action', sql.NVarChar(100), action)
      .input('entityType', sql.NVarChar(50), entityType)
      .input('entityId', sql.Int, entityId || null)
      .input('oldValues', sql.NVarChar(sql.MAX), oldValues ? JSON.stringify(oldValues) : null)
      .input('newValues', sql.NVarChar(sql.MAX), newValues ? JSON.stringify(newValues) : null)
      .input('ipAddress', sql.NVarChar(50), ipAddress || null)
      .query(`
        INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId, OldValues, NewValues, IpAddress)
        OUTPUT inserted.Id, inserted.CreatedAt
        VALUES (@userId, @action, @entityType, @entityId, @oldValues, @newValues, @ipAddress);
      `);
    return result.recordset[0];
  }

  async findAll({ page = 1, pageSize = 20, action, entityType, userId, fromDate, toDate }) {
    const pool = await getPool();
    const whereClauses = [];
    const request = pool.request();

    if (action) {
      whereClauses.push('a.Action = @action');
      request.input('action', sql.NVarChar(100), action);
    }
    if (entityType) {
      whereClauses.push('a.EntityType = @entityType');
      request.input('entityType', sql.NVarChar(50), entityType);
    }
    if (userId) {
      whereClauses.push('a.UserId = @userId');
      request.input('userId', sql.Int, userId);
    }
    if (fromDate) {
      whereClauses.push('a.CreatedAt >= @fromDate');
      request.input('fromDate', sql.DateTime2, new Date(fromDate));
    }
    if (toDate) {
      whereClauses.push('a.CreatedAt <= @toDate');
      request.input('toDate', sql.DateTime2, new Date(toDate));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    request.input('offset', sql.Int, offset);
    request.input('pageSize', sql.Int, pageSize);

    const query = `
      SELECT 
        a.Id,
        a.UserId,
        a.Action,
        a.EntityType,
        a.EntityId,
        a.OldValues,
        a.NewValues,
        a.IpAddress,
        a.CreatedAt,
        u.Username,
        u.FullName
      FROM AuditLogs a
      LEFT JOIN Users u ON a.UserId = u.Id
      ${whereSql}
      ORDER BY a.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

      SELECT COUNT(*) AS Total
      FROM AuditLogs a
      ${whereSql};
    `;

    const result = await request.query(query);
    const items = result.recordsets[0].map(row => ({
      ...row,
      OldValues: row.OldValues ? JSON.parse(row.OldValues) : null,
      NewValues: row.NewValues ? JSON.parse(row.NewValues) : null,
    }));
    const total = result.recordsets[1][0].Total;

    return {
      items,
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          a.Id,
          a.UserId,
          a.Action,
          a.EntityType,
          a.EntityId,
          a.OldValues,
          a.NewValues,
          a.IpAddress,
          a.CreatedAt,
          u.Username,
          u.FullName
        FROM AuditLogs a
        LEFT JOIN Users u ON a.UserId = u.Id
        WHERE a.Id = @id;
      `);

    if (result.recordset.length === 0) return null;
    const row = result.recordset[0];
    return {
      ...row,
      OldValues: row.OldValues ? JSON.parse(row.OldValues) : null,
      NewValues: row.NewValues ? JSON.parse(row.NewValues) : null,
    };
  }
}

module.exports = new AuditRepository();
