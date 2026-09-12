const { getPool, sql } = require('../../config/database');

class AuthRepository {
  async findByUsernameOrEmail(identifier) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('identifier', sql.NVarChar(100), identifier)
      .query(`
        SELECT Id, Username, Email, PasswordHash, FullName, AvatarUrl, IsActive
        FROM Users
        WHERE Username = @identifier OR Email = @identifier
      `);
    return result.recordset[0] || null;
  }

  async getUserRoles(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT r.Code, r.Name
        FROM Roles r
        INNER JOIN UserRoles ur ON r.Id = ur.RoleId
        WHERE ur.UserId = @userId AND r.IsActive = 1
      `);
    return result.recordset.map((r) => r.Code);
  }

  async getUserUnitScopes(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.UnitId, u.RoleId, u.IncludeDescendants, r.Code AS RoleCode, o.Name AS UnitName
        FROM UserUnitScopes u
        INNER JOIN Roles r ON u.RoleId = r.Id
        INNER JOIN OrganizationUnits o ON u.UnitId = o.Id
        WHERE u.UserId = @userId 
          AND (u.ValidTo IS NULL OR u.ValidTo >= SYSUTCDATETIME())
      `);
    return result.recordset;
  }

  async saveRefreshToken(userId, tokenHash, expiresAt) {
    const pool = await getPool();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('tokenHash', sql.NVarChar(255), tokenHash)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO RefreshTokens (UserId, TokenHash, ExpiresAt)
        VALUES (@userId, @tokenHash, @expiresAt)
      `);
  }

  async findRefreshToken(tokenHash) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('tokenHash', sql.NVarChar(255), tokenHash)
      .query(`
        SELECT Id, UserId, TokenHash, ExpiresAt, RevokedAt
        FROM RefreshTokens
        WHERE TokenHash = @tokenHash
      `);
    return result.recordset[0] || null;
  }

  async revokeRefreshToken(tokenHash) {
    const pool = await getPool();
    await pool
      .request()
      .input('tokenHash', sql.NVarChar(255), tokenHash)
      .query(`
        UPDATE RefreshTokens
        SET RevokedAt = SYSUTCDATETIME()
        WHERE TokenHash = @tokenHash
      `);
  }

  async updatePassword(userId, newPasswordHash) {
    const pool = await getPool();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('newPasswordHash', sql.NVarChar(255), newPasswordHash)
      .query(`
        UPDATE Users
        SET PasswordHash = @newPasswordHash, UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @userId
      `);
  }
}

module.exports = new AuthRepository();
