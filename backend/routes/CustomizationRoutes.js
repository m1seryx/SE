const express = require('express');
const router = express.Router();
const CustomizationController = require('../controller/CustomizationController');
const middleware = require('../middleware/AuthToken');

// Apply auth middleware to all routes except public ones
// Note: Custom models GET endpoints might need to be public for 3D viewer
// For now, keeping auth required - frontend should send token
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

// Custom 3D Models routes - MUST be before /:itemId route to avoid route conflicts
router.post('/upload-glb', 
  CustomizationController.uploadGLBFile, 
  CustomizationController.handleGLBUpload
);
router.get('/custom-models', CustomizationController.getAllCustom3DModels);
router.get('/custom-models/type/:type', CustomizationController.getCustom3DModelsByType);
router.delete('/custom-models/:modelId', CustomizationController.deleteCustom3DModel);

// Get single order item - MUST be after specific routes
router.get('/:itemId', CustomizationController.getCustomizationOrderById);

// Update order item (admin)
router.put('/:itemId', CustomizationController.updateCustomizationOrderItem);

// Update approval status (admin quick action)
router.put('/:itemId/status', CustomizationController.updateApprovalStatus);

module.exports = router;
