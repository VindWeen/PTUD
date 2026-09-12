const { getPool, sql } = require('../../config/database');

class AchievementsRepository {
  async create(data) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('lecturerId', sql.Int, data.lecturerId || null)
      .input('organizationUnitId', sql.Int, data.organizationUnitId || null)
      .input('contextUnitId', sql.Int, data.contextUnitId)
      .input('achievementTypeId', sql.Int, data.achievementTypeId)
      .input('title', sql.NVarChar(255), data.title)
      .input('description', sql.NVarChar(sql.MAX), data.description || null)
      .input('startDate', sql.Date, data.startDate || null)
      .input('endDate', sql.Date, data.endDate || null)
      .input('recognitionYear', sql.Int, data.recognitionYear)
      .input('academicYearId', sql.Int, data.academicYearId || null)
      .input('status', sql.NVarChar(30), data.status || 'DRAFT')
      .input('createdBy', sql.Int, data.createdBy)
      .query(`
        INSERT INTO Achievements (
          LecturerId, OrganizationUnitId, ContextUnitId, AchievementTypeId,
          Title, Description, StartDate, EndDate, RecognitionYear, AcademicYearId,
          Status, CreatedBy
        )
        OUTPUT INSERTED.Id, INSERTED.Title, INSERTED.Status, INSERTED.RecognitionYear, INSERTED.CreatedAt
        VALUES (
          @lecturerId, @organizationUnitId, @contextUnitId, @achievementTypeId,
          @title, @description, @startDate, @endDate, @recognitionYear, @academicYearId,
          @status, @createdBy
        )
      `);
    return result.recordset[0];
  }

  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          a.Id, a.LecturerId, a.OrganizationUnitId, a.ContextUnitId, a.AchievementTypeId,
          a.Title, a.Description, a.StartDate, a.EndDate, a.RecognitionYear, a.AcademicYearId,
          a.Status, a.CreatedBy, a.SubmittedBy, a.CreatedAt, a.UpdatedAt,
          CONVERT(VARCHAR(30), a.RowVersion, 1) AS RowVersion,
          t.Code AS TypeCode, t.Name AS TypeName, t.Category AS TypeCategory,
          u.FullName AS LecturerName, l.StaffCode AS LecturerStaffCode,
          o.Name AS UnitName, co.Name AS ContextUnitName,
          ay.Name AS AcademicYearName
        FROM Achievements a
        INNER JOIN AchievementTypes t ON a.AchievementTypeId = t.Id
        INNER JOIN OrganizationUnits co ON a.ContextUnitId = co.Id
        LEFT JOIN Lecturers l ON a.LecturerId = l.Id
        LEFT JOIN Users u ON l.UserId = u.Id
        LEFT JOIN OrganizationUnits o ON a.OrganizationUnitId = o.Id
        LEFT JOIN AcademicYears ay ON a.AcademicYearId = ay.Id
        WHERE a.Id = @id;

        SELECT 
          e.Id AS EvidenceId, e.Name AS EvidenceName, e.CreatedAt AS EvidenceCreatedAt,
          ef.Id AS FileId, ef.VersionNo, ef.OriginalFileName, ef.FileSizeBytes, ef.MimeType, ef.FileHash, ef.UploadedAt AS FileUploadedAt
        FROM Evidences e
        LEFT JOIN EvidenceFiles ef ON e.Id = ef.EvidenceId
        WHERE e.AchievementId = @id
        ORDER BY e.Id DESC, ef.VersionNo DESC;
      `);

    const achievement = result.recordsets[0][0];
    if (!achievement) return null;

    const rawEvidences = result.recordsets[1] || [];
    const evidencesMap = new Map();
    for (const row of rawEvidences) {
      if (!evidencesMap.has(row.EvidenceId)) {
        evidencesMap.set(row.EvidenceId, {
          id: row.EvidenceId,
          name: row.EvidenceName,
          createdAt: row.EvidenceCreatedAt,
          files: [],
        });
      }
      if (row.FileId) {
        evidencesMap.get(row.EvidenceId).files.push({
          id: row.FileId,
          versionNo: row.VersionNo,
          originalFileName: row.OriginalFileName,
          fileSizeBytes: row.FileSizeBytes,
          mimeType: row.MimeType,
          fileHash: row.FileHash,
          uploadedAt: row.FileUploadedAt,
        });
      }
    }

    achievement.evidences = Array.from(evidencesMap.values());
    return achievement;
  }

  async findAll({ lecturerId, organizationUnitId, contextUnitId, year, status, page = 1, pageSize = 20 }) {
    const pool = await getPool();
    const offset = (page - 1) * pageSize;

    const request = pool.request();
    let whereClauses = [];

    if (lecturerId) {
      request.input('lecturerId', sql.Int, lecturerId);
      whereClauses.push('a.LecturerId = @lecturerId');
    }
    if (organizationUnitId) {
      request.input('organizationUnitId', sql.Int, organizationUnitId);
      whereClauses.push('a.OrganizationUnitId = @organizationUnitId');
    }
    if (contextUnitId) {
      request.input('contextUnitId', sql.Int, contextUnitId);
      whereClauses.push('a.ContextUnitId = @contextUnitId');
    }
    if (year) {
      request.input('year', sql.Int, year);
      whereClauses.push('a.RecognitionYear = @year');
    }
    if (status) {
      request.input('status', sql.NVarChar(30), status);
      whereClauses.push('a.Status = @status');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    request.input('offset', sql.Int, offset);
    request.input('pageSize', sql.Int, pageSize);

    const query = `
      SELECT 
        a.Id, a.LecturerId, a.OrganizationUnitId, a.ContextUnitId, a.AchievementTypeId,
        a.Title, a.Description, a.RecognitionYear, a.Status, a.CreatedAt,
        CONVERT(VARCHAR(30), a.RowVersion, 1) AS RowVersion,
        t.Name AS TypeName, t.Category AS TypeCategory,
        u.FullName AS LecturerName,
        o.Name AS UnitName,
        (SELECT COUNT(1) FROM Evidences e WHERE e.AchievementId = a.Id) AS EvidencesCount
      FROM Achievements a
      INNER JOIN AchievementTypes t ON a.AchievementTypeId = t.Id
      LEFT JOIN Lecturers l ON a.LecturerId = l.Id
      LEFT JOIN Users u ON l.UserId = u.Id
      LEFT JOIN OrganizationUnits o ON a.OrganizationUnitId = o.Id
      ${whereSql}
      ORDER BY a.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

      SELECT COUNT(1) AS TotalCount FROM Achievements a ${whereSql};
    `;

    const result = await request.query(query);
    return {
      items: result.recordsets[0],
      total: result.recordsets[1][0].TotalCount,
      page,
      pageSize,
    };
  }

  async update(id, data, expectedRowVersion) {
    const pool = await getPool();
    const req = pool.request();
    req.input('id', sql.Int, id);
    req.input('title', sql.NVarChar(255), data.title);
    req.input('description', sql.NVarChar(sql.MAX), data.description !== undefined ? data.description : null);
    req.input('startDate', sql.Date, data.startDate || null);
    req.input('endDate', sql.Date, data.endDate || null);
    req.input('recognitionYear', sql.Int, data.recognitionYear);
    req.input('academicYearId', sql.Int, data.academicYearId || null);
    req.input('achievementTypeId', sql.Int, data.achievementTypeId);

    let rowVersionCondition = '';
    if (expectedRowVersion) {
      req.input('rowVersion', sql.VarChar(30), expectedRowVersion);
      rowVersionCondition = 'AND a.RowVersion = CONVERT(VARBINARY(8), @rowVersion, 1)';
    }

    const result = await req.query(`
      UPDATE Achievements
      SET 
        Title = @title,
        Description = @description,
        StartDate = @startDate,
        EndDate = @endDate,
        RecognitionYear = @recognitionYear,
        AcademicYearId = @academicYearId,
        AchievementTypeId = @achievementTypeId,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT 
        INSERTED.Id, INSERTED.Title, INSERTED.Status, INSERTED.RecognitionYear,
        CONVERT(VARCHAR(30), INSERTED.RowVersion, 1) AS RowVersion
      FROM Achievements a
      WHERE a.Id = @id ${rowVersionCondition}
    `);

    return result.recordset[0] || null;
  }

  async deleteDraft(id) {
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query("DELETE FROM Achievements WHERE Id = @id AND Status = 'DRAFT'");
  }
}

module.exports = new AchievementsRepository();
