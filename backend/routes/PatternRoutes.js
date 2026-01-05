const express = require('express');
const router = express.Router();
const PatternController = require('../controller/PatternController');
const middleware = require('../middleware/AuthToken');

// Public routes (no auth required for reading patterns)
// These are needed for the 3D customizer to load patterns without auth
router.get('/', PatternController.getAllPatterns);
router.get('/type/:type', PatternController.getPatternsByType);
router.get('/code/:code', PatternController.getPatternByCode);
router.get('/:patternId', PatternController.getPatternById);

// Protected routes (auth required for admin operations)
router.use(middleware.verifyToken);

// Create new procedural pattern
router.post('/', PatternController.createPattern);

// Upload pattern image and create pattern
router.post('/upload', 
  PatternController.uploadPatternImage, 
  PatternController.handlePatternImageUpload
);

// Update pattern (with optional image upload)
router.put('/:patternId', 
  PatternController.uploadPatternImage, 
  PatternController.updatePattern
);

// Delete pattern (soft delete)
router.delete('/:patternId', PatternController.deletePattern);

// Restore deleted pattern
router.post('/:patternId/restore', PatternController.restorePattern);

module.exports = router;
