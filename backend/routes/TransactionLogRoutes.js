const express = require('express');
const router = express.Router();
const transactionLogController = require('../controller/TransactionLogController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get transaction logs for an order item
router.get('/order-item/:orderItemId', transactionLogController.getTransactionLogsByOrderItem);

// Get transaction logs for current user
router.get('/my-logs', transactionLogController.getMyTransactionLogs);

// Get all transaction logs (admin only)
router.get('/all', requireAdmin, transactionLogController.getAllTransactionLogs);

// Get transaction summary for an order item
router.get('/summary/:orderItemId', transactionLogController.getTransactionSummary);

module.exports = router;

