const express = require('express');
const router = express.Router();
const appointmentSlotController = require('../controller/AppointmentSlotController');
const { verifyToken } = require('../middleware/AuthToken');

// Public routes (no auth needed for checking availability)
router.get('/available', appointmentSlotController.getAvailableSlots);
router.get('/check', appointmentSlotController.checkSlotAvailability);

// Protected routes (require authentication)
router.use(verifyToken);
router.post('/book', appointmentSlotController.bookSlot);
router.delete('/cancel/:slotId', appointmentSlotController.cancelSlot);
router.get('/user-slots', appointmentSlotController.getUserSlots);

module.exports = router;

