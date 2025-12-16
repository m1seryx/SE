const db = require('../config/db');

const AppointmentSlot = {
  // Check if a slot is available
  isSlotAvailable: (serviceType, date, time, callback) => {
    const sql = `
      SELECT COUNT(*) as count 
      FROM appointment_slots 
      WHERE service_type = ? 
      AND appointment_date = ? 
      AND appointment_time = ? 
      AND status = 'booked'
    `;
    db.query(sql, [serviceType, date, time], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0].count === 0);
    });
  },

  // Get all available time slots for a date and service type
  getAvailableSlots: (serviceType, date, callback) => {
    // Generate all possible time slots (8:00 AM to 5:00 PM, 30-minute intervals)
    const timeSlots = [];
    for (let hour = 8; hour < 17; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30:00`);
    }
    // Add 5:00 PM
    timeSlots.push('17:00:00');

    // Get booked slots for this date and service type
    const sql = `
      SELECT appointment_time 
      FROM appointment_slots 
      WHERE service_type = ? 
      AND appointment_date = ? 
      AND status = 'booked'
    `;
    db.query(sql, [serviceType, date], (err, results) => {
      if (err) {
        console.error('Database query error in getAvailableSlots:', err);
        return callback(err, null);
      }

      // Handle case where results might be empty or null
      if (!results || !Array.isArray(results)) {
        console.warn('Unexpected results format:', results);
        return callback(null, timeSlots); // Return all slots as available if query fails
      }

      // Handle case where appointment_time might be in different formats
      const bookedTimes = results.map(row => {
        const time = row.appointment_time;
        if (!time) return null;
        
        // If it's already a string in HH:MM:SS format
        if (typeof time === 'string') {
          return time;
        }
        
        // If it's a TIME object from MySQL, convert to string
        if (time && typeof time === 'object') {
          // MySQL TIME objects can be converted to string
          const timeStr = time.toString();
          // Ensure it's in HH:MM:SS format
          if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
            return timeStr;
          }
          // If it's in HH:MM format, add :00
          if (timeStr.match(/^\d{2}:\d{2}$/)) {
            return timeStr + ':00';
          }
        }
        
        return null;
      }).filter(Boolean);
      
      // Filter out booked slots - compare time strings
      const availableSlots = timeSlots.filter(slot => {
        // Normalize slot time (remove seconds if needed for comparison)
        const slotTime = slot.substring(0, 8); // HH:MM:SS
        return !bookedTimes.some(booked => {
          const bookedTime = booked.substring(0, 8); // HH:MM:SS
          return bookedTime === slotTime;
        });
      });

      callback(null, availableSlots);
    });
  },

  // Book a slot
  bookSlot: (serviceType, date, time, userId, cartItemId, callback) => {
    const sql = `
      INSERT INTO appointment_slots (service_type, appointment_date, appointment_time, user_id, cart_item_id, status)
      VALUES (?, ?, ?, ?, ?, 'booked')
    `;
    db.query(sql, [serviceType, date, time, userId, cartItemId], callback);
  },

  // Update slot when order is created
  updateSlotWithOrder: (slotId, orderItemId, callback) => {
    const sql = `
      UPDATE appointment_slots 
      SET order_item_id = ?, cart_item_id = NULL
      WHERE slot_id = ?
    `;
    db.query(sql, [orderItemId, slotId], callback);
  },

  // Get slot by cart item ID
  getSlotByCartItem: (cartItemId, callback) => {
    if (cartItemId) {
      const sql = `SELECT * FROM appointment_slots WHERE cart_item_id = ? AND status = 'booked'`;
      db.query(sql, [cartItemId], callback);
    } else {
      // Get all booked slots without cart_item_id (for linking)
      const sql = `SELECT * FROM appointment_slots WHERE cart_item_id IS NULL AND status = 'booked' ORDER BY created_at DESC`;
      db.query(sql, callback);
    }
  },

  // Update slot with cart item ID
  updateSlotWithCartItem: (slotId, cartItemId, callback) => {
    const sql = `UPDATE appointment_slots SET cart_item_id = ? WHERE slot_id = ?`;
    db.query(sql, [cartItemId, slotId], callback);
  },

  // Cancel a slot (when cart item is removed)
  cancelSlot: (slotId, callback) => {
    const sql = `UPDATE appointment_slots SET status = 'cancelled' WHERE slot_id = ?`;
    db.query(sql, [slotId], callback);
  },

  // Get all booked slots for a user
  getUserSlots: (userId, callback) => {
    const sql = `
      SELECT * FROM appointment_slots 
      WHERE user_id = ? AND status = 'booked'
      ORDER BY appointment_date, appointment_time
    `;
    db.query(sql, [userId], callback);
  },

  // Check if date is valid (Monday to Saturday)
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return day >= 1 && day <= 6; // Monday (1) to Saturday (6)
  }
};

module.exports = AppointmentSlot;

