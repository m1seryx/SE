const express = require('express');
const router = express.Router();
const dryCleaningController = require('../controller/DryCleaningController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');
const multer = require('multer');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Public routes (all authenticated users)
router.get('/', dryCleaningController.getAllDryCleaningServices);
router.get('/search', dryCleaningController.searchDryCleaningServices);
router.get('/:id', dryCleaningController.getDryCleaningServiceById);
router.get('/estimate/:id', dryCleaningController.getPriceEstimate);

// Image upload route
router.post('/upload-image', dryCleaningController.uploadDryCleaningImage);

// Admin only routes
router.post('/', requireAdmin, dryCleaningController.createDryCleaningService);
router.put('/:id', requireAdmin, dryCleaningController.updateDryCleaningService);
router.delete('/:id', requireAdmin, dryCleaningController.deleteDryCleaningService);

// Error handling middleware for file uploads
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ message: 'Only image files are allowed.' });
  }
  
  res.status(500).json({ message: 'Internal server error.' });
});

module.exports = router;
