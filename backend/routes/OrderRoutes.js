const express = require('express');
const router = express.Router();
const orderController = require('../controller/OrderController');
const middleware = require('../middleware/AuthToken');

// Apply authentication middleware to all routes
router.use(middleware.verifyToken);

// Order CRUD operations
router.get('/', orderController.getUserOrders);
router.get('/all', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

// Order status management
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/cancel', orderController.cancelOrder);

// Order item approval (admin only)
router.put('/items/:id/approval', orderController.updateItemApprovalStatus);

// Get orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

// Get pending approval items (admin only)
router.get('/pending-approvals', orderController.getPendingApprovalItems);

module.exports = router;
