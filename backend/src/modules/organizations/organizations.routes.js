const express = require('express');
const { authenticate, requireRoles } = require('../../middlewares/auth.middleware');
const { ROLES } = require('../../config/constants');
const orgController = require('./organizations.controller');

const router = express.Router();

router.use(authenticate);

// 1. Quản lý Đơn vị Tổ chức (OrganizationUnits)
router.get('/', orgController.getUnits);
router.post('/', requireRoles(ROLES.ADMIN), orgController.createUnit);
router.patch('/:id', requireRoles(ROLES.ADMIN), orgController.updateUnit);

// 2. Quản lý Phân công Phạm vi Duyệt (UserUnitScopes)
router.get('/scopes', requireRoles(ROLES.ADMIN, ROLES.MANAGER), orgController.getScopes);
router.post('/scopes', requireRoles(ROLES.ADMIN), orgController.createScope);
router.delete('/scopes/:id', requireRoles(ROLES.ADMIN), orgController.deleteScope);

// 3. Quản lý Đại diện Đơn vị (UnitRepresentatives)
router.get('/representatives', requireRoles(ROLES.ADMIN, ROLES.MANAGER), orgController.getRepresentatives);
router.post('/representatives', requireRoles(ROLES.ADMIN, ROLES.MANAGER), orgController.createRepresentative);
router.delete('/representatives/:id', requireRoles(ROLES.ADMIN, ROLES.MANAGER), orgController.deactivateRepresentative);

module.exports = router;
