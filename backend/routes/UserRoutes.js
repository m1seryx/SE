const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController');

// GET /api/user/rentals - Get available rental items with pagination and filters
router.get('/rentals', userController.getAvailableRentals);

// GET /api/user/rentals/featured - Get featured rentals for homepage
router.get('/rentals/featured', userController.getFeaturedRentals);

// GET /api/user/rentals/search - Search rental items
router.get('/rentals/search', userController.searchRentals);

// GET /api/user/rentals/categories - Get all categories
router.get('/rentals/categories', userController.getCategories);

// GET /api/user/rentals/category/:category - Get rentals by category
router.get('/rentals/category/:category', userController.getRentalsByCategory);

// GET /api/user/rentals/:id - Get rental item details
router.get('/rentals/:id', userController.getRentalDetails);

// GET /api/user/rentals/:id/similar - Get similar rentals
router.get('/rentals/:id/similar', userController.getSimilarRentals);

module.exports = router;
