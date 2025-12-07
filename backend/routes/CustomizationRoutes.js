const express = require('express');
const router = express.Router();
const CustomizationController = require('../controller/CustomizationController');
const middleware = require('../middleware/AuthToken');

// Apply auth middleware to all routes
router.use(middleware.verifyToken);

// Image upload endpoint
router.post('/upload-image', 
  CustomizationController.uploadCustomizationImage, 
  CustomizationController.handleImageUpload
);

// Get user's customization orders
router.get('/user', CustomizationController.getUserCustomizationOrders);

// Get all customization orders (admin)
router.get('/', CustomizationController.getAllCustomizationOrders);

// Get customization stats (admin dashboard)
router.get('/stats', CustomizationController.getCustomizationStats);

// Get single order item
router.get('/:itemId', CustomizationController.getCustomizationOrderById);

// Update order item (admin)
router.put('/:itemId', CustomizationController.updateCustomizationOrderItem);

// Update approval status (admin quick action)
router.put('/:itemId/status', CustomizationController.updateApprovalStatus);

module.exports = router;
