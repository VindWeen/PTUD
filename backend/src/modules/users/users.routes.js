const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const userController = require('./users.controller');

const router = express.Router();

router.use(authenticate);

// Thống kê & Danh mục vai trò
router.get('/stats', requireRoles(ROLES.ADMIN, ROLES.MANAGER), userController.getStats);
router.get('/roles', requireRoles(ROLES.ADMIN, ROLES.MANAGER), userController.getRoles);

// CRUD Quản trị Người dùng (Chỉ Admin)
router.get('/', requireRoles(ROLES.ADMIN, ROLES.MANAGER), userController.getUsers);
router.get('/:id', requireRoles(ROLES.ADMIN, ROLES.MANAGER), userController.getUserById);
router.post('/', requireRoles(ROLES.ADMIN), userController.createUser);
router.patch('/:id', requireRoles(ROLES.ADMIN), userController.updateUser);
router.post('/:id/roles', requireRoles(ROLES.ADMIN), userController.assignRoles);

module.exports = router;
