const { z } = require('zod');

const loginSchema = {
  body: z.object({
    username: z.string().min(1, 'Tên đăng nhập hoặc email không được để trống'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  }),
};

module.exports = {
  loginSchema,
  changePasswordSchema,
};
