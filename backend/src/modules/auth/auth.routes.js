const express = require('express');
const { login, logout, getMe, changePassword } = require('./auth.controller');
const { loginSchema, changePasswordSchema } = require('./auth.validator');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
