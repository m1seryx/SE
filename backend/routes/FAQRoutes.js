const express = require('express');
const router = express.Router();
const FAQController = require('../controller/FAQController');
const { verifyToken } = require('../middleware/AuthToken');

// Public routes
router.get('/', FAQController.getAllFAQs);
router.get('/categories', FAQController.getCategories);

// Protected routes (require authentication)
router.get('/user-votes', verifyToken, FAQController.getUserVotes);
router.post('/:faqId/vote', verifyToken, FAQController.voteFAQ);

module.exports = router;
