const express = require('express');
const router = express.Router();
const orderController = require('../controller/OrderController');
const orderPriceController = require('../controller/OrderPriceController');
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

// Repair specific routes (admin only)
router.get('/repair/orders', orderController.getRepairOrders);
router.get('/repair/orders/status/:status', orderController.getRepairOrdersByStatus);
router.put('/repair/items/:id', orderController.updateRepairOrderItem);

// Dry Cleaning specific routes (admin only)
router.get('/dry-cleaning/orders', orderController.getDryCleaningOrders);
router.get('/dry-cleaning/orders/status/:status', orderController.getDryCleaningOrdersByStatus);
router.put('/dry-cleaning/items/:id', orderController.updateDryCleaningOrderItem);

// Rental specific routes (admin only)
router.get('/rental/orders', orderController.getRentalOrders);
router.get('/rental/orders/status/:status', orderController.getRentalOrdersByStatus);
router.put('/rental/items/:id', orderController.updateRentalOrderItem);

// Price confirmation routes (user only)
router.post('/:itemId/accept-price', orderPriceController.acceptPrice);
router.post('/:itemId/decline-price', orderPriceController.declinePrice);

// Get order item details
router.get('/items/:itemId', orderController.getOrderItemDetails);

module.exports = router;
