const express = require('express');
const router = express.Router();
const walkInOrderController = require('../controller/WalkInOrderController');
const middleware = require('../middleware/AuthToken');

// Apply authentication middleware to all routes (admin only for walk-in orders)
router.use(middleware.verifyToken);

// Walk-in order creation endpoints
router.post('/dry-cleaning', walkInOrderController.createDryCleaningOrder);
router.post('/repair', walkInOrderController.createRepairOrder);
router.post('/customization', walkInOrderController.createCustomizationOrder);
router.post('/rental', walkInOrderController.createRentalOrder);

// Get all walk-in orders
router.get('/', walkInOrderController.getAllWalkInOrders);

// Get walk-in order by ID
router.get('/:id', walkInOrderController.getWalkInOrderById);

// Search walk-in customers
router.get('/customers/search', walkInOrderController.searchWalkInCustomers);

module.exports = router;

