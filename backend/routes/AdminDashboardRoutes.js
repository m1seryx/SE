const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');
const AdminDashboardController = require('../controller/AdminDashboardController');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get admin dashboard overview (stats + recent activity)
router.get('/dashboard', requireAdmin, AdminDashboardController.getDashboardOverview);

module.exports = router;
