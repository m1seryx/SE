const express = require('express');
const router = express.Router();
const appointmentSlotController = require('../controller/AppointmentSlotController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

// Public routes (no auth needed for checking availability)
router.get('/available', appointmentSlotController.getAvailableSlots);
router.get('/check', appointmentSlotController.checkSlotAvailability);
router.get('/slots-with-availability', appointmentSlotController.getAllSlotsWithAvailability);

// Protected routes (require authentication)
router.use(verifyToken);
router.post('/book', appointmentSlotController.bookSlot);
router.delete('/cancel/:slotId', appointmentSlotController.cancelSlot);
router.get('/user-slots', appointmentSlotController.getUserSlots);

// Admin routes (require admin authentication)
router.get('/admin/time-slots', requireAdmin, appointmentSlotController.getAllTimeSlots);
router.put('/admin/time-slots/update', requireAdmin, appointmentSlotController.updateTimeSlotCapacity);
router.get('/admin/availability', requireAdmin, appointmentSlotController.getTimeSlotAvailability);

module.exports = router;

