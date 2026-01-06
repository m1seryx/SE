const AppointmentSlot = require('../model/AppointmentSlotModel');
const db = require('../config/db');

// Function to ensure appointment_slots and time_slots tables exist
const ensureTableExists = (callback) => {
  // First, create time_slots table
  const createTimeSlotsSQL = `
    CREATE TABLE IF NOT EXISTS time_slots (
      slot_id INT AUTO_INCREMENT PRIMARY KEY,
      time_slot TIME NOT NULL UNIQUE COMMENT 'Time in HH:MM:SS format (e.g., 10:30:00)',
      capacity INT NOT NULL DEFAULT 5 COMMENT 'Maximum number of appointments allowed at this time',
      is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether this time slot is active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_time_slot (time_slot),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createTimeSlotsSQL, (err) => {
    if (err) {
      console.error('Error creating time_slots table:', err);
      return callback(err);
    }
    
    // Insert default time slots if they don't exist
    const insertDefaultSlotsSQL = `
      INSERT IGNORE INTO time_slots (time_slot, capacity, is_active) VALUES
      ('08:00:00', 5, 1), ('08:30:00', 5, 1), ('09:00:00', 5, 1), ('09:30:00', 5, 1),
      ('10:00:00', 5, 1), ('10:30:00', 5, 1), ('11:00:00', 5, 1), ('11:30:00', 5, 1),
      ('12:00:00', 5, 1), ('12:30:00', 5, 1), ('13:00:00', 5, 1), ('13:30:00', 5, 1),
      ('14:00:00', 5, 1), ('14:30:00', 5, 1), ('15:00:00', 5, 1), ('15:30:00', 5, 1),
      ('16:00:00', 5, 1), ('16:30:00', 5, 1), ('17:00:00', 5, 1)
    `;
    
    db.query(insertDefaultSlotsSQL, (err) => {
      if (err) {
        console.error('Error inserting default time slots:', err);
        // Continue even if insert fails (slots might already exist)
      }
      
      // Now create/update appointment_slots table (without unique constraint)
      const createAppointmentSlotsSQL = `
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
          
          INDEX idx_service_date (service_type, appointment_date),
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_appointment_datetime (appointment_date, appointment_time),
          INDEX idx_service_date_time (service_type, appointment_date, appointment_time, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      
      db.query(createAppointmentSlotsSQL, (err) => {
        if (err) {
          console.error('Error creating appointment_slots table:', err);
          return callback(err);
        }
        
        // Try to drop unique constraint if it exists (for existing tables)
        // MySQL doesn't support "DROP INDEX IF EXISTS" in older versions, so we'll try and ignore errors
        db.query(`ALTER TABLE appointment_slots DROP INDEX unique_slot`, (err) => {
          // Ignore errors (constraint might not exist, which is fine)
          // Error codes: ER_CANT_DROP_FIELD_OR_KEY (1091) means index doesn't exist
          if (err && err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.warn('Warning: Could not drop unique_slot index:', err.message);
          }
          callback(null);
        });
      });
    });
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

  // Ensure table exists before querying
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }

    // Validate date (check shop schedule)
    AppointmentSlot.isValidDate(date, (err, isValid) => {
      if (err) {
        console.error('[APPOINTMENT SLOT] Error validating date:', date, err);
        return res.status(500).json({
          success: false,
          message: "Error checking date availability. Please try again."
        });
      }
      
      if (!isValid) {
        console.log('[APPOINTMENT SLOT] Date not available:', date);
        return res.status(400).json({
          success: false,
          message: "Appointments are not available on this date. Please select another date."
        });
      }
    
      console.log('[APPOINTMENT SLOT] Date is valid, fetching slots for:', serviceType, date);
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
  });
};

// Get all time slots with availability status (for color-coded calendar display)
exports.getAllSlotsWithAvailability = (req, res) => {
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

  // Ensure table exists before querying
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }

    // First check if the date is valid (shop is open)
    AppointmentSlot.isValidDate(date, (err, isValid) => {
      if (err) {
        console.error('[APPOINTMENT SLOT] Error validating date:', date, err);
        return res.status(500).json({
          success: false,
          message: "Error checking date availability. Please try again."
        });
      }
      
      if (!isValid) {
        return res.json({
          success: true,
          message: "Shop is closed on this date",
          isShopOpen: false,
          date: date,
          slots: []
        });
      }

      // Get all time slots with their capacity
      const slotsSql = `SELECT slot_id, time_slot, capacity, is_active FROM time_slots ORDER BY time_slot`;
      db.query(slotsSql, [], (err, slotsResults) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error fetching time slots",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

        // Get booking counts for this date (only count confirmed orders, not cart items)
        const bookingsSql = `
          SELECT appointment_time, COUNT(*) as booked_count
          FROM appointment_slots
          WHERE appointment_date = ? AND status = 'booked' AND order_item_id IS NOT NULL
          GROUP BY appointment_time
        `;
        db.query(bookingsSql, [date], (err, bookingsResults) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error fetching bookings",
              error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
          }

          // Create map of booked counts
          const bookedCounts = {};
          if (bookingsResults && Array.isArray(bookingsResults)) {
            bookingsResults.forEach(row => {
              const time = row.appointment_time;
              let timeStr = typeof time === 'string' ? time : time.toString();
              if (!timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
                if (timeStr.match(/^\d{2}:\d{2}$/)) {
                  timeStr = timeStr + ':00';
                }
              }
              bookedCounts[timeStr] = row.booked_count || 0;
            });
          }

          // Combine slot info with booking counts and calculate availability status
          const slotsWithAvailability = slotsResults.map(slot => {
            const time = slot.time_slot;
            let timeStr = typeof time === 'string' ? time : time.toString();
            if (!timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
              if (timeStr.match(/^\d{2}:\d{2}$/)) {
                timeStr = timeStr + ':00';
              }
            }
            
            const booked = bookedCounts[timeStr] || 0;
            const capacity = slot.capacity || 10;
            const available = capacity - booked;
            const isActive = slot.is_active === 1;
            
            // Determine availability status and color
            let status, statusLabel, color;
            if (!isActive) {
              status = 'inactive';
              statusLabel = 'Unavailable';
              color = 'gray';
            } else if (booked >= capacity) {
              status = 'full';
              statusLabel = 'Fully Booked';
              color = 'red';
            } else if (booked >= 5) {
              status = 'limited';
              statusLabel = `Limited (${available} left)`;
              color = 'orange';
            } else {
              status = 'available';
              statusLabel = `Available (${available} spots)`;
              color = 'green';
            }

            // Format time for display (12-hour format)
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            const displayTime = `${displayHour}:${minutes} ${ampm}`;

            return {
              slot_id: slot.slot_id,
              time_slot: timeStr,
              display_time: displayTime,
              capacity: capacity,
              booked: booked,
              available: available,
              is_active: isActive,
              status: status,
              statusLabel: statusLabel,
              color: color,
              isClickable: isActive && booked < capacity
            };
          });

          res.json({
            success: true,
            message: "Slots with availability retrieved successfully",
            isShopOpen: true,
            date: date,
            slots: slotsWithAvailability
          });
        });
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

  // Ensure table exists before querying
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }

    // Validate date (check shop schedule)
    AppointmentSlot.isValidDate(date, (err, isValid) => {
      if (err || !isValid) {
        return res.status(400).json({
          success: false,
          message: "Appointments are not available on this date. Please select another date."
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
        message: "This time slot is full. Please select another time."
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

// ============ ADMIN ROUTES FOR TIME SLOT MANAGEMENT ============

// Get all time slots (admin)
exports.getAllTimeSlots = (req, res) => {
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    const sql = `SELECT * FROM time_slots ORDER BY time_slot`;
    db.query(sql, [], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching time slots",
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      res.json({
        success: true,
        message: "Time slots retrieved successfully",
        slots: results
      });
    });
  });
};

// Update time slot capacity (admin)
exports.updateTimeSlotCapacity = (req, res) => {
  const { slotId, capacity, isActive } = req.body;

  if (!slotId || capacity === undefined) {
    return res.status(400).json({
      success: false,
      message: "Slot ID and capacity are required"
    });
  }

  if (capacity < 0) {
    return res.status(400).json({
      success: false,
      message: "Capacity must be 0 or greater"
    });
  }

  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    const updates = [];
    const values = [];
    
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      values.push(capacity);
    }
    
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update"
      });
    }
    
    values.push(slotId);
    
    const sql = `UPDATE time_slots SET ${updates.join(', ')} WHERE slot_id = ?`;
    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error updating time slot",
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      res.json({
        success: true,
        message: "Time slot updated successfully"
      });
    });
  });
};

// Get time slot availability for a specific date (admin)
exports.getTimeSlotAvailability = (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Date is required"
    });
  }

  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    // Get all time slots with their capacity
    const slotsSql = `SELECT slot_id, time_slot, capacity, is_active FROM time_slots ORDER BY time_slot`;
    
    db.query(slotsSql, [], (err, slotsResults) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching time slots",
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      // Get booking counts for this date
      const bookingsSql = `
        SELECT appointment_time, COUNT(*) as booked_count
        FROM appointment_slots 
        WHERE appointment_date = ? AND status = 'booked'
        GROUP BY appointment_time
      `;
      
      db.query(bookingsSql, [date], (err, bookingsResults) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

        // Create map of booked counts
        const bookedCounts = {};
        if (bookingsResults && Array.isArray(bookingsResults)) {
          bookingsResults.forEach(row => {
            const time = row.appointment_time;
            let timeStr = typeof time === 'string' ? time : time.toString();
            if (!timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
              if (timeStr.match(/^\d{2}:\d{2}$/)) {
                timeStr = timeStr + ':00';
              }
            }
            bookedCounts[timeStr] = row.booked_count || 0;
          });
        }

        // Combine slot info with booking counts
        const availability = slotsResults.map(slot => {
          const time = slot.time_slot;
          let timeStr = typeof time === 'string' ? time : time.toString();
          if (!timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
            if (timeStr.match(/^\d{2}:\d{2}$/)) {
              timeStr = timeStr + ':00';
            }
          }
          
          const booked = bookedCounts[timeStr] || 0;
          const available = slot.is_active && booked < slot.capacity;
          
          return {
            slot_id: slot.slot_id,
            time_slot: timeStr,
            capacity: slot.capacity,
            booked: booked,
            available: slot.capacity - booked,
            is_active: slot.is_active === 1,
            is_full: booked >= slot.capacity
          };
        });

        res.json({
          success: true,
          message: "Time slot availability retrieved successfully",
          date: date,
          slots: availability
        });
      });
    });
  });
};

