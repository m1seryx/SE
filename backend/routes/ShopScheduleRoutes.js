const express = require('express');
const router = express.Router();
const shopScheduleController = require('../controller/ShopScheduleController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

// Public routes
router.get('/', shopScheduleController.getShopSchedule);
router.get('/check', shopScheduleController.checkDateOpen);

// Admin routes
router.get('/admin', verifyToken, requireAdmin, shopScheduleController.getShopScheduleAdmin);
router.put('/admin', verifyToken, requireAdmin, shopScheduleController.updateShopSchedule);

module.exports = router;

