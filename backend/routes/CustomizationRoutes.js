const express = require('express');
const router = express.Router();
const CustomizationController = require('../controller/CustomizationController');
const middleware = require('../middleware/AuthToken');

// Public routes for 3D customizer (no auth required)
// Custom models GET endpoints need to be public for 3D viewer to work
router.get('/custom-models', CustomizationController.getAllCustom3DModels);
router.get('/custom-models/type/:type', CustomizationController.getCustom3DModelsByType);

// Apply auth middleware to all routes below (protected routes)
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

// Custom 3D Models routes - POST and DELETE require auth (protected)
router.post('/upload-glb', 
  CustomizationController.uploadGLBFile, 
  CustomizationController.handleGLBUpload
);
router.delete('/custom-models/:modelId', CustomizationController.deleteCustom3DModel);

// Get single order item - MUST be after specific routes
router.get('/:itemId', CustomizationController.getCustomizationOrderById);

// Update order item (admin)
router.put('/:itemId', CustomizationController.updateCustomizationOrderItem);

// Update approval status (admin quick action)
router.put('/:itemId/status', CustomizationController.updateApprovalStatus);

module.exports = router;
