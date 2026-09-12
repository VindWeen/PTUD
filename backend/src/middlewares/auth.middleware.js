const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/appError');

function authenticate(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT.accessSecret);
    req.user = decoded; // { id, username, email, roles, unitScopes }
    next();
  } catch (err) {
    next(err);
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return next(new AppError('Không có quyền truy cập', 403, 'FORBIDDEN'));
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(new AppError('Bạn không có vai trò phù hợp để thực hiện hành động này', 403, 'FORBIDDEN'));
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRoles,
};
