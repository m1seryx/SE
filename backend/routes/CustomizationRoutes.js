const express = require('express');
const router = express.Router();
const CustomizationController = require('../controller/CustomizationController');

// Get all customization services
router.get('/services', CustomizationController.getAllServices);

// Get customization service by ID
router.get('/services/:id', CustomizationController.getServiceById);

// Create new customization service
router.post('/services', CustomizationController.createService);

// Update customization service
router.put('/services/:id', CustomizationController.updateService);

// Delete customization service
router.delete('/services/:id', CustomizationController.deleteService);

// Search customization services
router.get('/search', CustomizationController.searchServices);

module.exports = router;