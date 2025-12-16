const express = require('express');
const router = express.Router();
const fabricTypeController = require('../controller/FabricTypeController');
const { verifyToken } = require('../middleware/AuthToken');

// Public route - get all active fabric types
router.get('/', fabricTypeController.getAllFabricTypes);

// Protected routes (require authentication)
router.use(verifyToken);

// Admin routes - get all fabric types (including inactive)
router.get('/admin', fabricTypeController.getAllFabricTypesAdmin);

// Get fabric type by ID
router.get('/:fabricId', fabricTypeController.getFabricTypeById);

// Create new fabric type (admin only)
router.post('/', fabricTypeController.createFabricType);

// Update fabric type (admin only)
router.put('/:fabricId', fabricTypeController.updateFabricType);

// Delete fabric type (admin only)
router.delete('/:fabricId', fabricTypeController.deleteFabricType);

module.exports = router;

