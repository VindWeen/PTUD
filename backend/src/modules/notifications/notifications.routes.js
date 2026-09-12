const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const notifController = require('./notifications.controller');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/notifications
router.get('/', notifController.getNotifications);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', notifController.getUnreadCount);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', notifController.markAllAsRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', notifController.markAsRead);

module.exports = router;
