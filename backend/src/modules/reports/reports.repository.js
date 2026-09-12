const { getPool, sql } = require('../../config/database');

/**
 * Lấy số liệu thống kê tổng hợp cho Dashboard (Cá nhân hoặc Đơn vị)
 * @param {Object} params
 * @param {number} [params.userId] - Dùng cho mode Personal
 * @param {number} [params.lecturerId] - Dùng cho mode Personal
 * @param {number} [params.unitId] - Dùng cho mode Unit
 * @param {number} [params.year] - Lọc theo năm công nhận
 */
async function getDashboardSummary({ userId, lecturerId, unitId, year }) {
  const pool = await getPool();

  // 1. Thống kê Thành tích (Achievements)
  let achWhere = ['1=1'];
  const achReq = pool.request();

  if (lecturerId) {
    achWhere.push('a.LecturerId = @lecturerId');
    achReq.input('lecturerId', sql.Int, lecturerId);
  } else if (unitId) {
    // Ca bắt buộc 8: Thống kê theo ContextUnitId ghi nhận lịch sử (kèm bộ môn trực thuộc nếu là Khoa)
    achWhere.push('a.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId)');
    achReq.input('unitId', sql.Int, unitId);
  }

  if (year) {
    achWhere.push('a.RecognitionYear = @year');
    achReq.input('year', sql.Int, year);
  }

  const achQuery = `
    SELECT 
      -- Ca bắt buộc 11: REVOKED tuyệt đối không tính vào số liệu hợp lệ
      COUNT(CASE WHEN a.Status = 'VERIFIED' THEN 1 END) AS VerifiedCount,
      COUNT(CASE WHEN a.Status = 'SUBMITTED' THEN 1 END) AS PendingCount,
      COUNT(CASE WHEN a.Status = 'NEED_CORRECTION' THEN 1 END) AS NeedCorrectionCount,
      COUNT(CASE WHEN a.Status = 'REJECTED' THEN 1 END) AS RejectedCount,
      COUNT(CASE WHEN a.Status = 'REVOKED' THEN 1 END) AS RevokedCount,
      COUNT(CASE WHEN a.Status = 'DRAFT' THEN 1 END) AS DraftCount,
      COUNT(1) AS TotalCount
    FROM Achievements a
    WHERE ${achWhere.join(' AND ')};
  `;
  const achResult = await achReq.query(achQuery);
  const achievements = achResult.recordset[0];

  // 2. Thống kê Khen thưởng (AwardRecords)
  // Ca bắt buộc 7: Khen thưởng RECORDED là bảng số liệu độc lập với Thành tích VERIFIED
  let awardWhere = ['1=1'];
  const awardReq = pool.request();

  if (lecturerId) {
    awardWhere.push('ar.LecturerId = @lecturerId');
    awardReq.input('lecturerId', sql.Int, lecturerId);
  } else if (unitId) {
    // Khen thưởng cấp đơn vị hoặc thuộc ContextUnitId (kèm con cháu)
    awardWhere.push('(ar.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId) OR ar.OrganizationUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId))');
    awardReq.input('unitId', sql.Int, unitId);
  }

  if (year) {
    awardWhere.push('ar.RecognitionYear = @year');
    awardReq.input('year', sql.Int, year);
  }

  const awardQuery = `
    SELECT 
      -- Ca bắt buộc 11: Chỉ tính RECORDED là danh hiệu hợp lệ, loại trừ REVOKED
      COUNT(CASE WHEN ar.Status = 'RECORDED' THEN 1 END) AS RecordedCount,
      COUNT(CASE WHEN ar.Status = 'RECORDED' AND ar.LecturerId IS NOT NULL THEN 1 END) AS IndividualCount,
      COUNT(CASE WHEN ar.Status = 'RECORDED' AND ar.OrganizationUnitId IS NOT NULL THEN 1 END) AS UnitCount,
      COUNT(CASE WHEN ar.Status = 'REVOKED' THEN 1 END) AS RevokedAwardCount,
      COUNT(CASE WHEN ar.Status = 'DRAFT' THEN 1 END) AS DraftAwardCount
    FROM AwardRecords ar
    WHERE ${awardWhere.join(' AND ')};
  `;
  const awardResult = await awardReq.query(awardQuery);
  const awards = awardResult.recordset[0];

  // 3. Phân bố theo Danh mục thành tích hợp lệ (Category breakdown)
  const catReq = pool.request();
  let catWhere = ['a.Status = \'VERIFIED\'']; // Chỉ tính hợp lệ

  if (lecturerId) {
    catWhere.push('a.LecturerId = @lecturerId');
    catReq.input('lecturerId', sql.Int, lecturerId);
  } else if (unitId) {
    catWhere.push('a.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId)');
    catReq.input('unitId', sql.Int, unitId);
  }
  if (year) {
    catWhere.push('a.RecognitionYear = @year');
    catReq.input('year', sql.Int, year);
  }

  const catQuery = `
    SELECT 
      t.Category,
      COUNT(1) AS Count
    FROM Achievements a
    JOIN AchievementTypes t ON a.AchievementTypeId = t.Id
    WHERE ${catWhere.join(' AND ')}
    GROUP BY t.Category;
  `;
  const catResult = await catReq.query(catQuery);
  const categoryMap = {
    RESEARCH: 0,
    TEACHING: 0,
    AWARD: 0,
    OTHER: 0
  };
  catResult.recordset.forEach(r => {
    categoryMap[r.Category] = r.Count;
  });

  // 4. Xu hướng thành tích qua các năm (Yearly Trend)
  const trendReq = pool.request();
  let trendWhere = ['a.Status = \'VERIFIED\''];
  if (lecturerId) {
    trendWhere.push('a.LecturerId = @lecturerId');
    trendReq.input('lecturerId', sql.Int, lecturerId);
  } else if (unitId) {
    trendWhere.push('a.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId)');
    trendReq.input('unitId', sql.Int, unitId);
  }

  const trendQuery = `
    SELECT 
      a.RecognitionYear AS Year,
      COUNT(1) AS VerifiedCount
    FROM Achievements a
    WHERE ${trendWhere.join(' AND ')}
    GROUP BY a.RecognitionYear
    ORDER BY a.RecognitionYear ASC;
  `;
  const trendResult = await trendReq.query(trendQuery);

  return {
    achievements,
    awards,
    categories: categoryMap,
    yearlyTrend: trendResult.recordset
  };
}

/**
 * Báo cáo chi tiết Thành tích (Ca 8: Nhóm theo ContextUnitId, Ca 11: Tách REVOKED)
 */
async function getAchievementsReport({ year, unitId, status, category, page = 1, pageSize = 20 }) {
  const pool = await getPool();
  const offset = (page - 1) * pageSize;

  let whereClauses = ['1=1'];
  const req = pool.request()
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, pageSize);

  if (year) {
    whereClauses.push('a.RecognitionYear = @year');
    req.input('year', sql.Int, parseInt(year, 10));
  }
  if (unitId) {
    // Ca 8: Lọc chuẩn xác theo ContextUnitId nơi phát sinh thành tích (kèm con cháu nếu là Khoa)
    whereClauses.push('a.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId)');
    req.input('unitId', sql.Int, parseInt(unitId, 10));
  }
  if (status) {
    whereClauses.push('a.Status = @status');
    req.input('status', sql.NVarChar(30), status);
  }
  if (category) {
    whereClauses.push('t.Category = @category');
    req.input('category', sql.NVarChar(50), category);
  }

  const query = `
    SELECT 
      a.Id, a.Title, a.Description, a.RecognitionYear, a.Status, a.CreatedAt,
      a.ContextUnitId, co.Name AS ContextUnitName, co.Code AS ContextUnitCode,
      t.Name AS TypeName, t.Category AS TypeCategory,
      CASE 
        WHEN a.LecturerId IS NOT NULL THEN u.FullName 
        ELSE ou.Name 
      END AS SubjectName,
      CASE 
        WHEN a.LecturerId IS NOT NULL THEN N'Cá nhân' 
        ELSE N'Tập thể' 
      END AS SubjectType,
      l.StaffCode,
      (SELECT COUNT(1) FROM Evidences e WHERE e.AchievementId = a.Id) AS EvidenceCount,
      COUNT(1) OVER() AS TotalCount
    FROM Achievements a
    JOIN AchievementTypes t ON a.AchievementTypeId = t.Id
    JOIN OrganizationUnits co ON a.ContextUnitId = co.Id
    LEFT JOIN Lecturers l ON a.LecturerId = l.Id
    LEFT JOIN Users u ON l.UserId = u.Id
    LEFT JOIN OrganizationUnits ou ON a.OrganizationUnitId = ou.Id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY a.RecognitionYear DESC, a.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `;

  const result = await req.query(query);
  const items = result.recordset;
  const total = items.length > 0 ? items[0].TotalCount : 0;

  return {
    items,
    pagination: {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Báo cáo chi tiết Khen thưởng (Ca 7 & Ca 11)
 */
async function getAwardsReport({ year, unitId, awardTypeId, decisionId, page = 1, pageSize = 20 }) {
  const pool = await getPool();
  const offset = (page - 1) * pageSize;

  let whereClauses = ['1=1'];
  const req = pool.request()
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, pageSize);

  if (year) {
    whereClauses.push('ar.RecognitionYear = @year');
    req.input('year', sql.Int, parseInt(year, 10));
  }
  if (unitId) {
    whereClauses.push('(ar.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId) OR ar.OrganizationUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId))');
    req.input('unitId', sql.Int, parseInt(unitId, 10));
  }
  if (awardTypeId) {
    whereClauses.push('ar.AwardTypeId = @awardTypeId');
    req.input('awardTypeId', sql.Int, parseInt(awardTypeId, 10));
  }
  if (decisionId) {
    whereClauses.push('ar.DecisionId = @decisionId');
    req.input('decisionId', sql.Int, parseInt(decisionId, 10));
  }

  const query = `
    SELECT 
      ar.Id, ar.RecognitionYear, ar.Status, ar.RecordedAt, ar.Notes,
      at.Code AS AwardTypeCode, at.Name AS AwardTypeName, at.Level AS AwardLevel,
      d.DecisionNumber, d.IssuedDate, d.SignerTitle,
      co.Name AS ContextUnitName,
      CASE 
        WHEN ar.LecturerId IS NOT NULL THEN u.FullName 
        ELSE ou.Name 
      END AS SubjectName,
      CASE 
        WHEN ar.LecturerId IS NOT NULL THEN N'Cá nhân' 
        ELSE N'Tập thể' 
      END AS SubjectType,
      l.StaffCode,
      COUNT(1) OVER() AS TotalCount
    FROM AwardRecords ar
    JOIN AwardTypes at ON ar.AwardTypeId = at.Id
    JOIN AwardDecisions d ON ar.DecisionId = d.Id
    JOIN OrganizationUnits co ON ar.ContextUnitId = co.Id
    LEFT JOIN Lecturers l ON ar.LecturerId = l.Id
    LEFT JOIN Users u ON l.UserId = u.Id
    LEFT JOIN OrganizationUnits ou ON ar.OrganizationUnitId = ou.Id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY ar.RecognitionYear DESC, ar.RecordedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `;

  const result = await req.query(query);
  const items = result.recordset;
  const total = items.length > 0 ? items[0].TotalCount : 0;

  return {
    items,
    pagination: {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Lấy toàn bộ bản ghi phục vụ xuất CSV (không phân trang, tối đa 5000)
 */
async function getAchievementsForExport({ year, unitId, status }) {
  const pool = await getPool();
  let whereClauses = ['1=1'];
  const req = pool.request();

  if (year) {
    whereClauses.push('a.RecognitionYear = @year');
    req.input('year', sql.Int, parseInt(year, 10));
  }
  if (unitId) {
    whereClauses.push('a.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId)');
    req.input('unitId', sql.Int, parseInt(unitId, 10));
  }
  if (status) {
    whereClauses.push('a.Status = @status');
    req.input('status', sql.NVarChar(30), status);
  }

  const query = `
    SELECT TOP 5000
      a.Id, a.Title, a.RecognitionYear, a.Status,
      t.Name AS TypeName, t.Category AS TypeCategory,
      co.Name AS ContextUnitName,
      CASE 
        WHEN a.LecturerId IS NOT NULL THEN u.FullName 
        ELSE ou.Name 
      END AS SubjectName,
      CASE 
        WHEN a.LecturerId IS NOT NULL THEN N'Cá nhân' 
        ELSE N'Tập thể' 
      END AS SubjectType,
      ISNULL(l.StaffCode, '') AS StaffCode,
      a.CreatedAt
    FROM Achievements a
    JOIN AchievementTypes t ON a.AchievementTypeId = t.Id
    JOIN OrganizationUnits co ON a.ContextUnitId = co.Id
    LEFT JOIN Lecturers l ON a.LecturerId = l.Id
    LEFT JOIN Users u ON l.UserId = u.Id
    LEFT JOIN OrganizationUnits ou ON a.OrganizationUnitId = ou.Id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY a.RecognitionYear DESC, a.CreatedAt DESC;
  `;

  const result = await req.query(query);
  return result.recordset;
}

/**
 * Lấy toàn bộ bản ghi khen thưởng phục vụ xuất CSV
 */
async function getAwardsForExport({ year, unitId }) {
  const pool = await getPool();
  let whereClauses = ['1=1'];
  const req = pool.request();

  if (year) {
    whereClauses.push('ar.RecognitionYear = @year');
    req.input('year', sql.Int, parseInt(year, 10));
  }
  if (unitId) {
    whereClauses.push('(ar.ContextUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId) OR ar.OrganizationUnitId IN (SELECT Id FROM OrganizationUnits WHERE Id = @unitId OR ParentId = @unitId))');
    req.input('unitId', sql.Int, parseInt(unitId, 10));
  }

  const query = `
    SELECT TOP 5000
      ar.Id, ar.RecognitionYear, ar.Status,
      at.Code AS AwardTypeCode, at.Name AS AwardTypeName, at.Level AS AwardLevel,
      d.DecisionNumber, d.IssuedDate,
      co.Name AS ContextUnitName,
      CASE 
        WHEN ar.LecturerId IS NOT NULL THEN u.FullName 
        ELSE ou.Name 
      END AS SubjectName,
      CASE 
        WHEN ar.LecturerId IS NOT NULL THEN N'Cá nhân' 
        ELSE N'Tập thể' 
      END AS SubjectType,
      ISNULL(l.StaffCode, '') AS StaffCode,
      ar.RecordedAt
    FROM AwardRecords ar
    JOIN AwardTypes at ON ar.AwardTypeId = at.Id
    JOIN AwardDecisions d ON ar.DecisionId = d.Id
    JOIN OrganizationUnits co ON ar.ContextUnitId = co.Id
    LEFT JOIN Lecturers l ON ar.LecturerId = l.Id
    LEFT JOIN Users u ON l.UserId = u.Id
    LEFT JOIN OrganizationUnits ou ON ar.OrganizationUnitId = ou.Id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY ar.RecognitionYear DESC, ar.RecordedAt DESC;
  `;

  const result = await req.query(query);
  return result.recordset;
}

module.exports = {
  getDashboardSummary,
  getAchievementsReport,
  getAwardsReport,
  getAchievementsForExport,
  getAwardsForExport
};
