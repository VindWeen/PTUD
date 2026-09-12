const { getPool, sql } = require('../../config/database');

class AwardsRepository {
  async getTypes() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, Code, Name, Category, AwardLevel, ApplicableTo, Description
      FROM AwardTypes
      WHERE IsActive = 1
      ORDER BY Category, Id
    `);
    return result.recordset;
  }

  async getDecisions(search = '') {
    const pool = await getPool();
    const req = pool.request();
    let whereClause = '';
    if (search && search.trim()) {
      req.input('search', sql.NVarChar(100), `%${search.trim()}%`);
      whereClause = 'WHERE d.DecisionNumber LIKE @search OR d.IssuingAuthority LIKE @search OR d.Notes LIKE @search';
    }

    const query = `
      SELECT 
        d.Id, d.DecisionNumber, d.SignDate, d.SignerTitle, d.SignerName, d.IssuingAuthority, d.Notes, d.CreatedAt,
        (SELECT COUNT(1) FROM AwardRecords r WHERE r.DecisionId = d.Id) AS TotalAwardsCount,
        (SELECT COUNT(1) FROM AwardRecords r WHERE r.DecisionId = d.Id AND r.Status = 'RECORDED') AS RecordedAwardsCount,
        f.Id AS FileId, f.OriginalFileName, f.FileSizeBytes, f.FileHash
      FROM AwardDecisions d
      LEFT JOIN AwardDecisionFiles f ON d.Id = f.DecisionId
      ${whereClause}
      ORDER BY d.SignDate DESC, d.Id DESC
    `;

    const result = await req.query(query);
    return result.recordset;
  }

  async findDecisionById(id) {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, id).query(`
      SELECT 
        d.Id, d.DecisionNumber, d.SignDate, d.SignerTitle, d.SignerName, d.IssuingAuthority, d.Notes, d.CreatedAt,
        f.Id AS FileId, f.OriginalFileName, f.FileSizeBytes, f.FileHash, f.FilePath, f.MimeType
      FROM AwardDecisions d
      LEFT JOIN AwardDecisionFiles f ON d.Id = f.DecisionId
      WHERE d.Id = @id;

      SELECT 
        r.Id, r.LecturerId, r.OrganizationUnitId, r.RecognitionYear, r.Status,
        t.Name AS AwardTypeName, t.Category AS AwardCategory, t.AwardLevel,
        u.FullName AS LecturerName, o.Name AS UnitName
      FROM AwardRecords r
      INNER JOIN AwardTypes t ON r.AwardTypeId = t.Id
      LEFT JOIN Lecturers l ON r.LecturerId = l.Id
      LEFT JOIN Users u ON l.UserId = u.Id
      LEFT JOIN OrganizationUnits o ON r.OrganizationUnitId = o.Id
      WHERE r.DecisionId = @id
      ORDER BY r.Id ASC;
    `);

    const decision = result.recordsets[0][0];
    if (!decision) return null;
    decision.records = result.recordsets[1] || [];
    return decision;
  }

  async findDecisionByNumber(decisionNumber) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('num', sql.NVarChar(100), decisionNumber.trim())
      .query('SELECT Id, DecisionNumber, SignDate, IssuingAuthority FROM AwardDecisions WHERE DecisionNumber = @num');
    return result.recordset[0] || null;
  }

  async createDecision(data, fileData, userId) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const decReq = new sql.Request(transaction);
      decReq.input('decisionNumber', sql.NVarChar(100), data.decisionNumber.trim());
      decReq.input('signDate', sql.Date, data.signDate);
      decReq.input('signerTitle', sql.NVarChar(100), data.signerTitle || null);
      decReq.input('signerName', sql.NVarChar(100), data.signerName || null);
      decReq.input('issuingAuthority', sql.NVarChar(150), data.issuingAuthority.trim());
      decReq.input('notes', sql.NVarChar(sql.MAX), data.notes || null);
      decReq.input('createdBy', sql.Int, userId);

      const decRes = await decReq.query(`
        INSERT INTO AwardDecisions (DecisionNumber, SignDate, SignerTitle, SignerName, IssuingAuthority, Notes, CreatedBy)
        OUTPUT INSERTED.Id, INSERTED.DecisionNumber, INSERTED.SignDate, INSERTED.IssuingAuthority
        VALUES (@decisionNumber, @signDate, @signerTitle, @signerName, @issuingAuthority, @notes, @createdBy)
      `);
      const decision = decRes.recordset[0];

      if (fileData) {
        const fileReq = new sql.Request(transaction);
        fileReq.input('decisionId', sql.Int, decision.Id);
        fileReq.input('originalFileName', sql.NVarChar(255), fileData.originalFileName);
        fileReq.input('storageFileName', sql.NVarChar(255), fileData.storageFileName);
        fileReq.input('filePath', sql.NVarChar(500), fileData.filePath);
        fileReq.input('mimeType', sql.NVarChar(100), fileData.mimeType);
        fileReq.input('fileSizeBytes', sql.BigInt, fileData.fileSizeBytes);
        fileReq.input('fileHash', sql.NVarChar(64), fileData.fileHash);
        fileReq.input('uploadedBy', sql.Int, userId);

        await fileReq.query(`
          INSERT INTO AwardDecisionFiles (DecisionId, OriginalFileName, StorageFileName, FilePath, MimeType, FileSizeBytes, FileHash, UploadedBy)
          VALUES (@decisionId, @originalFileName, @storageFileName, @filePath, @mimeType, @fileSizeBytes, @fileHash, @uploadedBy)
        `);
      }

      await transaction.commit();
      return decision;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async findRecordById(id) {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, id).query(`
      SELECT 
        r.Id, r.LecturerId, r.OrganizationUnitId, r.ContextUnitId, r.AwardTypeId, r.DecisionId,
        r.RecognitionYear, r.AcademicYearId, r.PeriodStart, r.PeriodEnd, r.Status,
        r.RecordedBy, r.RecordedAt, r.Notes, r.CreatedAt, r.UpdatedAt,
        CONVERT(VARCHAR(30), r.RowVersion, 1) AS RowVersion,
        t.Code AS AwardTypeCode, t.Name AS AwardTypeName, t.Category AS AwardCategory, t.AwardLevel,
        d.DecisionNumber, d.SignDate, d.IssuingAuthority, d.SignerName, d.SignerTitle,
        u.FullName AS LecturerName, l.StaffCode AS LecturerStaffCode,
        o.Name AS UnitName, o.Code AS UnitCode,
        co.Name AS ContextUnitName,
        ru.FullName AS RecordedByName
      FROM AwardRecords r
      INNER JOIN AwardTypes t ON r.AwardTypeId = t.Id
      INNER JOIN AwardDecisions d ON r.DecisionId = d.Id
      INNER JOIN OrganizationUnits co ON r.ContextUnitId = co.Id
      LEFT JOIN Lecturers l ON r.LecturerId = l.Id
      LEFT JOIN Users u ON l.UserId = u.Id
      LEFT JOIN OrganizationUnits o ON r.OrganizationUnitId = o.Id
      LEFT JOIN Users ru ON r.RecordedBy = ru.Id
      WHERE r.Id = @id;

      SELECT 
        a.Id AS AchievementId, a.Title AS AchievementTitle, a.RecognitionYear,
        at.Name AS AchievementTypeName, ra.Notes
      FROM AwardRecordAchievements ra
      INNER JOIN Achievements a ON ra.AchievementId = a.Id
      INNER JOIN AchievementTypes at ON a.AchievementTypeId = at.Id
      WHERE ra.AwardRecordId = @id;
    `);

    const record = result.recordsets[0][0];
    if (!record) return null;
    record.linkedAchievements = result.recordsets[1] || [];
    return record;
  }

  async findAllRecords({
    year,
    status,
    category,
    awardTypeId,
    decisionId,
    lecturerId,
    organizationUnitId,
    contextUnitId,
    search,
    page = 1,
    pageSize = 20,
  }) {
    const pool = await getPool();
    const offset = (page - 1) * pageSize;
    const req = pool.request();
    const whereClauses = [];

    if (year) {
      req.input('year', sql.Int, year);
      whereClauses.push('r.RecognitionYear = @year');
    }
    if (status) {
      req.input('status', sql.NVarChar(30), status);
      whereClauses.push('r.Status = @status');
    }
    if (category) {
      req.input('category', sql.NVarChar(50), category);
      whereClauses.push('t.Category = @category');
    }
    if (awardTypeId) {
      req.input('awardTypeId', sql.Int, awardTypeId);
      whereClauses.push('r.AwardTypeId = @awardTypeId');
    }
    if (decisionId) {
      req.input('decisionId', sql.Int, decisionId);
      whereClauses.push('r.DecisionId = @decisionId');
    }
    if (lecturerId) {
      req.input('lecturerId', sql.Int, lecturerId);
      whereClauses.push('r.LecturerId = @lecturerId');
    }
    if (organizationUnitId) {
      req.input('organizationUnitId', sql.Int, organizationUnitId);
      whereClauses.push('r.OrganizationUnitId = @organizationUnitId');
    }
    if (contextUnitId) {
      req.input('contextUnitId', sql.Int, contextUnitId);
      whereClauses.push('r.ContextUnitId = @contextUnitId');
    }
    if (search && search.trim()) {
      req.input('search', sql.NVarChar(150), `%${search.trim()}%`);
      whereClauses.push(`(
        d.DecisionNumber LIKE @search OR
        t.Name LIKE @search OR
        u.FullName LIKE @search OR
        o.Name LIKE @search OR
        r.Notes LIKE @search
      )`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    req.input('offset', sql.Int, offset);
    req.input('pageSize', sql.Int, pageSize);

    const query = `
      SELECT 
        r.Id, r.LecturerId, r.OrganizationUnitId, r.ContextUnitId, r.AwardTypeId, r.DecisionId,
        r.RecognitionYear, r.Status, r.RecordedAt, r.Notes, r.CreatedAt,
        CONVERT(VARCHAR(30), r.RowVersion, 1) AS RowVersion,
        t.Code AS AwardTypeCode, t.Name AS AwardTypeName, t.Category AS AwardCategory, t.AwardLevel,
        d.DecisionNumber, d.SignDate, d.IssuingAuthority,
        u.FullName AS LecturerName,
        o.Name AS UnitName,
        co.Name AS ContextUnitName,
        (SELECT COUNT(1) FROM AwardRecordAchievements ra WHERE ra.AwardRecordId = r.Id) AS LinkedAchievementsCount
      FROM AwardRecords r
      INNER JOIN AwardTypes t ON r.AwardTypeId = t.Id
      INNER JOIN AwardDecisions d ON r.DecisionId = d.Id
      INNER JOIN OrganizationUnits co ON r.ContextUnitId = co.Id
      LEFT JOIN Lecturers l ON r.LecturerId = l.Id
      LEFT JOIN Users u ON l.UserId = u.Id
      LEFT JOIN OrganizationUnits o ON r.OrganizationUnitId = o.Id
      ${whereSql}
      ORDER BY r.RecognitionYear DESC, d.SignDate DESC, r.Id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

      SELECT COUNT(1) AS TotalCount
      FROM AwardRecords r
      INNER JOIN AwardTypes t ON r.AwardTypeId = t.Id
      INNER JOIN AwardDecisions d ON r.DecisionId = d.Id
      LEFT JOIN Lecturers l ON r.LecturerId = l.Id
      LEFT JOIN Users u ON l.UserId = u.Id
      LEFT JOIN OrganizationUnits o ON r.OrganizationUnitId = o.Id
      ${whereSql};
    `;

    const result = await req.query(query);
    return {
      items: result.recordsets[0],
      total: result.recordsets[1][0].TotalCount,
      page,
      pageSize,
    };
  }

  async checkDuplicateRecorded(lecturerId, organizationUnitId, awardTypeId, decisionId) {
    const pool = await getPool();
    const req = pool.request();
    req.input('awardTypeId', sql.Int, awardTypeId);
    req.input('decisionId', sql.Int, decisionId);

    let ownerCondition = '';
    if (lecturerId) {
      req.input('lecturerId', sql.Int, lecturerId);
      ownerCondition = 'LecturerId = @lecturerId';
    } else {
      req.input('organizationUnitId', sql.Int, organizationUnitId);
      ownerCondition = 'OrganizationUnitId = @organizationUnitId';
    }

    const result = await req.query(`
      SELECT TOP 1 Id FROM AwardRecords
      WHERE ${ownerCondition} AND AwardTypeId = @awardTypeId AND DecisionId = @decisionId AND Status = 'RECORDED'
    `);
    return !!result.recordset[0];
  }

  async createRecord(data, userId) {
    const pool = await getPool();
    const req = pool.request();
    req.input('lecturerId', sql.Int, data.lecturerId || null);
    req.input('organizationUnitId', sql.Int, data.organizationUnitId || null);
    req.input('contextUnitId', sql.Int, data.contextUnitId);
    req.input('awardTypeId', sql.Int, data.awardTypeId);
    req.input('decisionId', sql.Int, data.decisionId);
    req.input('recognitionYear', sql.Int, data.recognitionYear);
    req.input('academicYearId', sql.Int, data.academicYearId || null);
    req.input('status', sql.NVarChar(30), data.status || 'DRAFT');
    req.input('notes', sql.NVarChar(sql.MAX), data.notes || null);
    req.input('recordedBy', sql.Int, data.status === 'RECORDED' ? userId : null);
    req.input('createdBy', sql.Int, userId);

    const result = await req.query(`
      INSERT INTO AwardRecords (
        LecturerId, OrganizationUnitId, ContextUnitId, AwardTypeId, DecisionId,
        RecognitionYear, AcademicYearId, Status, RecordedBy, RecordedAt, Notes, CreatedBy
      )
      OUTPUT 
        INSERTED.Id, INSERTED.Status, INSERTED.RecognitionYear,
        CONVERT(VARCHAR(30), INSERTED.RowVersion, 1) AS RowVersion
      VALUES (
        @lecturerId, @organizationUnitId, @contextUnitId, @awardTypeId, @decisionId,
        @recognitionYear, @academicYearId, @status, @recordedBy,
        CASE WHEN @status = 'RECORDED' THEN SYSUTCDATETIME() ELSE NULL END,
        @notes, @createdBy
      )
    `);

    return result.recordset[0];
  }

  async updateRecord(id, data, expectedRowVersion) {
    const pool = await getPool();
    const req = pool.request();
    req.input('id', sql.Int, id);
    req.input('awardTypeId', sql.Int, data.awardTypeId);
    req.input('decisionId', sql.Int, data.decisionId);
    req.input('recognitionYear', sql.Int, data.recognitionYear);
    req.input('notes', sql.NVarChar(sql.MAX), data.notes || null);

    let rowVersionCondition = '';
    if (expectedRowVersion) {
      req.input('rowVersion', sql.VarChar(30), expectedRowVersion);
      rowVersionCondition = 'AND a.RowVersion = CONVERT(VARBINARY(8), @rowVersion, 1)';
    }

    const result = await req.query(`
      UPDATE AwardRecords
      SET 
        AwardTypeId = @awardTypeId,
        DecisionId = @decisionId,
        RecognitionYear = @recognitionYear,
        Notes = @notes,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT 
        INSERTED.Id, INSERTED.Status, INSERTED.RecognitionYear,
        CONVERT(VARCHAR(30), INSERTED.RowVersion, 1) AS RowVersion
      FROM AwardRecords a
      WHERE a.Id = @id AND a.Status = 'DRAFT' ${rowVersionCondition}
    `);

    return result.recordset[0] || null;
  }

  async recordAward(id, userId, expectedRowVersion) {
    const pool = await getPool();
    const req = pool.request();
    req.input('id', sql.Int, id);
    req.input('recordedBy', sql.Int, userId);

    let rowVersionCondition = '';
    if (expectedRowVersion) {
      req.input('rowVersion', sql.VarChar(30), expectedRowVersion);
      rowVersionCondition = 'AND a.RowVersion = CONVERT(VARBINARY(8), @rowVersion, 1)';
    }

    const result = await req.query(`
      UPDATE AwardRecords
      SET 
        Status = 'RECORDED',
        RecordedBy = @recordedBy,
        RecordedAt = SYSUTCDATETIME(),
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT 
        INSERTED.Id, INSERTED.Status, INSERTED.RecognitionYear,
        CONVERT(VARCHAR(30), INSERTED.RowVersion, 1) AS RowVersion
      FROM AwardRecords a
      WHERE a.Id = @id AND a.Status = 'DRAFT' ${rowVersionCondition}
    `);

    return result.recordset[0] || null;
  }

  async revokeAward(id, userId, expectedRowVersion) {
    const pool = await getPool();
    const req = pool.request();
    req.input('id', sql.Int, id);

    let rowVersionCondition = '';
    if (expectedRowVersion) {
      req.input('rowVersion', sql.VarChar(30), expectedRowVersion);
      rowVersionCondition = 'AND a.RowVersion = CONVERT(VARBINARY(8), @rowVersion, 1)';
    }

    const result = await req.query(`
      UPDATE AwardRecords
      SET 
        Status = 'REVOKED',
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT 
        INSERTED.Id, INSERTED.Status, INSERTED.RecognitionYear,
        CONVERT(VARCHAR(30), INSERTED.RowVersion, 1) AS RowVersion
      FROM AwardRecords a
      WHERE a.Id = @id AND a.Status = 'RECORDED' ${rowVersionCondition}
    `);

    return result.recordset[0] || null;
  }

  async createHistory(awardRecordId, fromStatus, toStatus, actorId, reason) {
    const pool = await getPool();
    await pool
      .request()
      .input('awardRecordId', sql.Int, awardRecordId)
      .input('fromStatus', sql.NVarChar(30), fromStatus)
      .input('toStatus', sql.NVarChar(30), toStatus)
      .input('actorId', sql.Int, actorId)
      .input('reason', sql.NVarChar(sql.MAX), reason)
      .query(`
        INSERT INTO AwardRecordHistories (AwardRecordId, FromStatus, ToStatus, ActorId, Reason)
        VALUES (@awardRecordId, @fromStatus, @toStatus, @actorId, @reason)
      `);
  }

  async getRecordHistory(awardRecordId) {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, awardRecordId).query(`
      SELECT 
        h.Id, h.FromStatus, h.ToStatus, h.Reason, h.CreatedAt,
        u.FullName AS ActorName, u.Username AS ActorUsername,
        (SELECT TOP 1 r.Name FROM UserRoles ur INNER JOIN Roles r ON ur.RoleId = r.Id WHERE ur.UserId = u.Id) AS ActorRole
      FROM AwardRecordHistories h
      INNER JOIN Users u ON h.ActorId = u.Id
      WHERE h.AwardRecordId = @id
      ORDER BY h.CreatedAt ASC
    `);
    return result.recordset;
  }

  async linkAchievements(awardRecordId, achievementIds) {
    if (!achievementIds || achievementIds.length === 0) return;
    const pool = await getPool();
    for (const achId of achievementIds) {
      await pool
        .request()
        .input('awardRecordId', sql.Int, awardRecordId)
        .input('achievementId', sql.Int, achId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM AwardRecordAchievements WHERE AwardRecordId = @awardRecordId AND AchievementId = @achievementId)
          BEGIN
            INSERT INTO AwardRecordAchievements (AwardRecordId, AchievementId)
            VALUES (@awardRecordId, @achievementId)
          END
        `);
    }
  }
}

module.exports = new AwardsRepository();
