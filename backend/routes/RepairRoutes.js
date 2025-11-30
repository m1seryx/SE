const express = require('express');
const router = express.Router();
const repairController = require('../controller/RepairController');
const middleware = require('../middleware/AuthToken');

// Apply authentication middleware to all routes
router.use(middleware.verifyToken);

// Public routes (for authenticated users)
router.get('/', repairController.getAllRepairServices);
router.get('/search', repairController.searchRepairServices);
router.get('/damage/:damageLevel', repairController.getRepairServicesByDamageLevel);
router.get('/estimate/:damageLevel', repairController.getPriceEstimate);
router.get('/:id', repairController.getRepairServiceById);

// File upload route
router.post('/upload-image', repairController.uploadRepairImage);

// Admin only routes (you can add admin middleware later if needed)
router.post('/', repairController.createRepairService);
router.put('/:id', repairController.updateRepairService);
router.delete('/:id', repairController.deleteRepairService);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Repair routes error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in repair service',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;
