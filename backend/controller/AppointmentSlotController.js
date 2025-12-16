const AppointmentSlot = require('../model/AppointmentSlotModel');
const db = require('../config/db');

// Function to ensure appointment_slots table exists
const ensureTableExists = (callback) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS appointment_slots (
      slot_id INT AUTO_INCREMENT PRIMARY KEY,
      service_type ENUM('dry_cleaning', 'repair', 'customization') NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      user_id INT NOT NULL,
      order_item_id INT NULL COMMENT 'Reference to the order item when order is created',
      cart_item_id INT NULL COMMENT 'Reference to cart item if still in cart',
      status ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      UNIQUE KEY unique_slot (service_type, appointment_date, appointment_time),
      INDEX idx_service_date (service_type, appointment_date),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_appointment_datetime (appointment_date, appointment_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating appointment_slots table:', err);
      return callback(err);
    }
    callback(null);
  });
};

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

  // Ensure table exists before querying
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    AppointmentSlot.getAvailableSlots(serviceType, date, (err, slots) => {
    if (err) {
      console.error('Error fetching available slots:', err);
      console.error('Error details:', {
        code: err.code,
        errno: err.errno,
        sqlMessage: err.sqlMessage,
        sqlState: err.sqlState
      });
      
      // Check if table doesn't exist
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: "Database table 'appointment_slots' does not exist. Please run the migration script to create it.",
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Error fetching available slots",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

  // Ensure table exists before querying
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    AppointmentSlot.isSlotAvailable(serviceType, date, time, (err, isAvailable) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error checking slot availability",
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      res.json({
        success: true,
        available: isAvailable
      });
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

  // Ensure table exists before querying
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
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

  // Ensure table exists before querying
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    AppointmentSlot.getUserSlots(userId, (err, slots) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching user slots",
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      res.json({
        success: true,
        message: "User slots retrieved successfully",
        slots: slots
      });
    });
  });
};

