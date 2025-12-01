const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/InventoryController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all completed items (admin only)
router.get('/items', requireAdmin, inventoryController.getCompletedItems);

// Get items by service type (admin only)
router.get('/items/service/:serviceType', requireAdmin, inventoryController.getItemsByServiceType);

// Get inventory statistics (admin only)
router.get('/stats', requireAdmin, inventoryController.getInventoryStats);

module.exports = router;