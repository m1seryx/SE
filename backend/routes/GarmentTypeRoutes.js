const express = require('express');
const router = express.Router();
const garmentTypeController = require('../controller/GarmentTypeController');
const { verifyToken } = require('../middleware/AuthToken');

// Public route - get all active garment types
router.get('/', garmentTypeController.getAllGarmentTypes);

// Protected routes (require authentication)
router.use(verifyToken);

// Admin routes - get all garment types (including inactive)
router.get('/admin', garmentTypeController.getAllGarmentTypesAdmin);

// Get garment type by ID
router.get('/:garmentId', garmentTypeController.getGarmentTypeById);

// Create new garment type (admin only)
router.post('/', garmentTypeController.createGarmentType);

// Update garment type (admin only)
router.put('/:garmentId', garmentTypeController.updateGarmentType);

// Delete garment type (admin only)
router.delete('/:garmentId', garmentTypeController.deleteGarmentType);

module.exports = router;

