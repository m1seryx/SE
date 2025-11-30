const express = require('express');
const router = express.Router();
const rentalController = require('../controller/RentalController');
const { uploadSingle, handleUploadError } = require('../middleware/UploadMiddleware');


router.post('/', uploadSingle.single('image'), rentalController.createRental);


router.get('/', rentalController.getAllRentals);


router.get('/available', rentalController.getAvailableRentals);


router.get('/categories', rentalController.getCategories);


router.get('/search', rentalController.searchRentals);


router.get('/category/:category', rentalController.getRentalsByCategory);


router.get('/:item_id', rentalController.getRentalById);


router.put('/:item_id', uploadSingle.single('image'), rentalController.updateRental);


router.put('/:item_id/status', rentalController.updateRentalStatus);


router.delete('/:item_id', rentalController.deleteRental);


router.use(handleUploadError);

module.exports = router;
