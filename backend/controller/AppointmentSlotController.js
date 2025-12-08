const AppointmentSlot = require('../model/AppointmentSlotModel');

// Get available time slots for a date and service type
exports.getAvailableSlots = (req, res) => {
  const { serviceType, date } = req.query;

  if (!serviceType || !date) {
    return res.status(400).json({
      success: false,
      message: "Service type and date are required"
    });
  }

  // Validate service type
  if (!['dry_cleaning', 'repair', 'customization'].includes(serviceType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid service type. Must be: dry_cleaning, repair, or customization"
    });
  }

  // Validate date (Monday to Saturday)
  if (!AppointmentSlot.isValidDate(date)) {
    return res.status(400).json({
      success: false,
      message: "Appointments are only available Monday to Saturday"
    });
  }

  AppointmentSlot.getAvailableSlots(serviceType, date, (err, slots) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching available slots",
        error: err
      });
    }

    // Format time slots for display (convert 24-hour to 12-hour format)
    const formattedSlots = slots.map(slot => {
      const [hours, minutes] = slot.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return {
        value: slot,
        display: `${displayHour}:${minutes} ${ampm}`
      };
    });

    res.json({
      success: true,
      message: "Available slots retrieved successfully",
      slots: formattedSlots
    });
  });
};

// Check if a specific slot is available
exports.checkSlotAvailability = (req, res) => {
  const { serviceType, date, time } = req.query;

  if (!serviceType || !date || !time) {
    return res.status(400).json({
      success: false,
      message: "Service type, date, and time are required"
    });
  }

  AppointmentSlot.isSlotAvailable(serviceType, date, time, (err, isAvailable) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error checking slot availability",
        error: err
      });
    }

    res.json({
      success: true,
      available: isAvailable
    });
  });
};

// Book a slot
exports.bookSlot = (req, res) => {
  const { serviceType, date, time, cartItemId } = req.body;
  const userId = req.user?.id; // From JWT token

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User authentication required"
    });
  }

  if (!serviceType || !date || !time) {
    return res.status(400).json({
      success: false,
      message: "Service type, date, and time are required"
    });
  }

  // Validate service type
  if (!['dry_cleaning', 'repair', 'customization'].includes(serviceType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid service type"
    });
  }

  // Validate date (Monday to Saturday)
  if (!AppointmentSlot.isValidDate(date)) {
    return res.status(400).json({
      success: false,
      message: "Appointments are only available Monday to Saturday"
    });
  }

  // Check if slot is available
  AppointmentSlot.isSlotAvailable(serviceType, date, time, (err, isAvailable) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error checking slot availability",
        error: err
      });
    }

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked"
      });
    }

    // Book the slot
    AppointmentSlot.bookSlot(serviceType, date, time, userId, cartItemId || null, (err, result) => {
      if (err) {
        // Check if it's a duplicate entry error
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            success: false,
            message: "This time slot was just booked by another user"
          });
        }
        return res.status(500).json({
          success: false,
          message: "Error booking slot",
          error: err
        });
      }

      res.json({
        success: true,
        message: "Slot booked successfully",
        slotId: result.insertId
      });
    });
  });
};

// Cancel a slot
exports.cancelSlot = (req, res) => {
  const { slotId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User authentication required"
    });
  }

  AppointmentSlot.cancelSlot(slotId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error cancelling slot",
        error: err
      });
    }

    res.json({
      success: true,
      message: "Slot cancelled successfully"
    });
  });
};

// Get user's booked slots
exports.getUserSlots = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User authentication required"
    });
  }

  AppointmentSlot.getUserSlots(userId, (err, slots) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching user slots",
        error: err
      });
    }

    res.json({
      success: true,
      message: "User slots retrieved successfully",
      slots: slots
    });
  });
};

