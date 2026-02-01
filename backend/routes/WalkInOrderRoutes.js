const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const walkInOrderController = require('../controller/WalkInOrderController');
const middleware = require('../middleware/AuthToken');

// Configure multer for reference image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/customization-references/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'walkin-ref-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Apply authentication middleware to all routes (admin only for walk-in orders)
router.use(middleware.verifyToken);

// Walk-in order creation endpoints
router.post('/dry-cleaning', walkInOrderController.createDryCleaningOrder);
router.post('/repair', walkInOrderController.createRepairOrder);
router.post('/customization', upload.single('referenceImage'), walkInOrderController.createCustomizationOrder);
router.post('/rental', walkInOrderController.createRentalOrder);

// Get all walk-in orders
router.get('/', walkInOrderController.getAllWalkInOrders);

// Get walk-in order by ID
router.get('/:id', walkInOrderController.getWalkInOrderById);

// Search walk-in customers
router.get('/customers/search', walkInOrderController.searchWalkInCustomers);

module.exports = router;

