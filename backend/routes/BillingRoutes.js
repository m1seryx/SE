const express = require('express');
const router = express.Router();
const billingController = require('../controller/BillingController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all billing records (admin only)
router.get('/records', requireAdmin, billingController.getAllBillingRecords);

// Get billing records by status (admin only)
router.get('/records/status/:status', requireAdmin, billingController.getBillingRecordsByStatus);

// Update billing record status (admin only)
router.put('/records/:id/status', requireAdmin, billingController.updateBillingRecordStatus);

// Get billing statistics (admin only)
router.get('/stats', requireAdmin, billingController.getBillingStats);

module.exports = router;