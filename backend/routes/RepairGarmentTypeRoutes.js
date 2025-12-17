const express = require('express');
const router = express.Router();
const repairGarmentTypeController = require('../controller/RepairGarmentTypeController');
const { verifyToken } = require('../middleware/AuthToken');

// Public route - get all active repair garment types
router.get('/', repairGarmentTypeController.getAllRepairGarmentTypes);

// Protected routes (require authentication)
router.use(verifyToken);

// Admin routes - get all repair garment types (including inactive)
router.get('/admin', repairGarmentTypeController.getAllRepairGarmentTypesAdmin);

// Get repair garment type by ID
router.get('/:garmentId', repairGarmentTypeController.getRepairGarmentTypeById);

// Create new repair garment type (admin only)
router.post('/', repairGarmentTypeController.createRepairGarmentType);

// Update repair garment type (admin only)
router.put('/:garmentId', repairGarmentTypeController.updateRepairGarmentType);

// Delete repair garment type (admin only)
router.delete('/:garmentId', repairGarmentTypeController.deleteRepairGarmentType);

module.exports = router;

