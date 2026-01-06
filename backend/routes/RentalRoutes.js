const express = require('express');
const router = express.Router();
const rentalController = require('../controller/RentalController');
const { uploadSingle, handleUploadError } = require('../middleware/UploadMiddleware');

// Define fields for multiple image uploads (front, back, side)
const rentalImageFields = uploadSingle.fields([
  { name: 'image', maxCount: 1 },      // Legacy single image support
  { name: 'front_image', maxCount: 1 },
  { name: 'back_image', maxCount: 1 },
  { name: 'side_image', maxCount: 1 }
]);

router.post('/', rentalImageFields, rentalController.createRental);


router.get('/', rentalController.getAllRentals);


router.get('/available', rentalController.getAvailableRentals);


router.get('/categories', rentalController.getCategories);


router.get('/search', rentalController.searchRentals);


router.get('/category/:category', rentalController.getRentalsByCategory);


router.get('/:item_id', rentalController.getRentalById);


router.put('/:item_id', rentalImageFields, rentalController.updateRental);


router.put('/:item_id/status', rentalController.updateRentalStatus);


router.delete('/:item_id', rentalController.deleteRental);


router.use(handleUploadError);

module.exports = router;
