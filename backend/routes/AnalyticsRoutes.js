const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');
const AnalyticsController = require('../controller/AnalyticsController');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Revenue overview - summary cards with growth rates
router.get('/overview', requireAdmin, AnalyticsController.getRevenueOverview);

// Revenue trend - line chart data (daily/weekly/monthly/yearly)
router.get('/trend', requireAdmin, AnalyticsController.getRevenueTrend);

// Revenue by service type - pie chart data
router.get('/by-service', requireAdmin, AnalyticsController.getRevenueByService);

// Top performing services - bar chart data
router.get('/top-services', requireAdmin, AnalyticsController.getTopServices);

// Revenue comparison - current vs previous period
router.get('/comparison', requireAdmin, AnalyticsController.getRevenueComparison);

// Top customers by revenue
router.get('/top-customers', requireAdmin, AnalyticsController.getTopCustomers);

// Detailed analytics with filters
router.get('/detailed', requireAdmin, AnalyticsController.getDetailedAnalytics);

module.exports = router;
