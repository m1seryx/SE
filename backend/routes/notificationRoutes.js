const express = require('express');
const router = express.Router();
const notificationController = require('../controller/NotificationController');
const { verifyToken } = require('../middleware/AuthToken');

// All routes require authentication
router.use(verifyToken);

// Get all notifications for the authenticated user
router.get('/', notificationController.getUserNotifications);

// Get unread notifications count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark a notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;
