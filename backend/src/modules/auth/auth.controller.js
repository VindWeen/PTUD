const authService = require('./auth.service');
const { success } = require('../../utils/apiResponse');
const env = require('../../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(username, password);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return success(
      res,
      {
        user,
        accessToken,
      },
      'Đăng nhập thành công'
    );
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    await authService.logout(refreshToken);

    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return success(res, null, 'Đăng xuất thành công');
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    return success(res, req.user, 'Lấy thông tin người dùng thành công');
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);

    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
};
