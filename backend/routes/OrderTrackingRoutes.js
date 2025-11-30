const express = require('express');
const router = express.Router();
const OrderTrackingController = require('../controller/OrderTrackingController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

// Get all order tracking for the authenticated user
router.get('/', verifyToken, OrderTrackingController.getUserOrderTracking);

// Get tracking history for a specific order item
router.get('/history/:id', verifyToken, OrderTrackingController.getOrderItemTrackingHistory);

// Get available status transitions for an order item (admin only)
router.get('/transitions/:id', verifyToken, requireAdmin, OrderTrackingController.getStatusTransitions);

// Update tracking status (admin only)
router.post('/update/:id', verifyToken, requireAdmin, OrderTrackingController.updateTrackingStatus);

module.exports = router;
