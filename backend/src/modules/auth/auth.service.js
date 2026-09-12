const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');
const AppError = require('../../utils/appError');
const authRepository = require('./auth.repository');

class AuthService {
  generateTokens(user, roles, unitScopes) {
    const payload = {
      id: user.Id,
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      roles,
      unitScopes,
    };

    const accessToken = jwt.sign(payload, env.JWT.accessSecret, {
      expiresIn: env.JWT.accessExpiresIn,
    });

    const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');

    // Default 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return {
      accessToken,
      refreshTokenRaw,
      refreshTokenHash,
      expiresAt,
    };
  }

  async login(username, password) {
    const user = await authRepository.findByUsernameOrEmail(username);
    if (!user) {
      throw new AppError('Tên đăng nhập hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.IsActive) {
      throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 403, 'ACCOUNT_INACTIVE');
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      throw new AppError('Tên đăng nhập hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
    }

    const roles = await authRepository.getUserRoles(user.Id);
    const unitScopes = await authRepository.getUserUnitScopes(user.Id);

    const { accessToken, refreshTokenRaw, refreshTokenHash, expiresAt } = this.generateTokens(
      user,
      roles,
      unitScopes
    );

    await authRepository.saveRefreshToken(user.Id, refreshTokenHash, expiresAt);

    return {
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        avatarUrl: user.AvatarUrl,
        roles,
        unitScopes,
      },
      accessToken,
      refreshToken: refreshTokenRaw,
    };
  }

  async logout(refreshTokenRaw) {
    if (refreshTokenRaw) {
      const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
      await authRepository.revokeRefreshToken(tokenHash);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const pool = await require('../../config/database').getPool();
    const result = await pool
      .request()
      .input('userId', require('mssql').Int, userId)
      .query('SELECT PasswordHash FROM Users WHERE Id = @userId');

    const user = result.recordset[0];
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không đúng', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(userId, newHash);
  }
}

module.exports = new AuthService();
