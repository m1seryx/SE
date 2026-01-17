const db = require('../config/db');

const AppointmentSlot = {
  // Check if a slot is available (based on capacity)
  isSlotAvailable: (serviceType, date, time, callback) => {
    // First, get the capacity for this time slot
    const capacitySql = `
      SELECT capacity 
      FROM time_slots 
      WHERE time_slot = ? AND is_active = 1
    `;
    
    db.query(capacitySql, [time], (err, capacityResults) => {
      if (err) return callback(err, null);
      
      // If time slot doesn't exist or is inactive, not available
      if (!capacityResults || capacityResults.length === 0) {
        return callback(null, false);
      }
      
      const capacity = capacityResults[0].capacity || 5; // Default to 5 if null
      
      // Count current bookings for this time slot (only count confirmed orders, not cart items)
      // Slots only occupy capacity when order is submitted (order_item_id IS NOT NULL)
      // Cart items don't reserve slots until order is submitted
      const countSql = `
        SELECT COUNT(*) as count 
        FROM appointment_slots 
        WHERE appointment_date = ? 
        AND appointment_time = ? 
        AND status = 'booked'
        AND order_item_id IS NOT NULL
      `;
      
      db.query(countSql, [date, time], (err, countResults) => {
        if (err) return callback(err, null);
        
        const currentBookings = countResults[0].count || 0;
        const isAvailable = currentBookings < capacity;
        
        callback(null, isAvailable);
      });
    });
  },

  // Get all available time slots for a date and service type (based on capacity)
  getAvailableSlots: (serviceType, date, callback) => {
    // Get all active time slots from time_slots table
    const slotsSql = `
      SELECT time_slot, capacity 
      FROM time_slots 
      WHERE is_active = 1 
      ORDER BY time_slot
    `;
    
    db.query(slotsSql, [], (err, slotsResults) => {
      if (err) {
        console.error('Database query error in getAvailableSlots (fetching slots):', err);
        // Fallback to default slots if table doesn't exist yet
        const defaultSlots = [];
        for (let hour = 8; hour < 17; hour++) {
          defaultSlots.push(`${hour.toString().padStart(2, '0')}:00:00`);
          defaultSlots.push(`${hour.toString().padStart(2, '0')}:30:00`);
        }
        defaultSlots.push('17:00:00');
        return callback(null, defaultSlots);
      }

      if (!slotsResults || slotsResults.length === 0) {
        // No slots defined, return empty array
        return callback(null, []);
      }

      // Get count of bookings for each time slot on this date (only count confirmed orders, not cart items)
      // Slots only occupy capacity when order is submitted (order_item_id IS NOT NULL)
      // Cart items don't reserve slots until order is submitted
      const bookingsSql = `
        SELECT appointment_time, COUNT(*) as booked_count
        FROM appointment_slots 
        WHERE appointment_date = ? 
        AND status = 'booked'
        AND order_item_id IS NOT NULL
        GROUP BY appointment_time
      `;
      
      db.query(bookingsSql, [date], (err, bookingsResults) => {
        if (err) {
          console.error('Database query error in getAvailableSlots (fetching bookings):', err);
          // Return all slots as available if query fails
          const allSlots = slotsResults.map(row => {
            const time = row.time_slot;
            return typeof time === 'string' ? time : time.toString();
          });
          return callback(null, allSlots);
        }

        // Create a map of booked counts by time
        const bookedCounts = {};
        if (bookingsResults && Array.isArray(bookingsResults)) {
          bookingsResults.forEach(row => {
            const time = row.appointment_time;
            let timeStr = '';
            
            if (typeof time === 'string') {
              timeStr = time;
            } else if (time && typeof time === 'object') {
              timeStr = time.toString();
              if (!timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
                if (timeStr.match(/^\d{2}:\d{2}$/)) {
                  timeStr = timeStr + ':00';
                }
              }
            }
            
            if (timeStr) {
              bookedCounts[timeStr] = row.booked_count || 0;
            }
          });
        }

        // Filter slots based on capacity
        const availableSlots = slotsResults
          .map(row => {
            const time = row.time_slot;
            let timeStr = '';
            
            if (typeof time === 'string') {
              timeStr = time;
            } else if (time && typeof time === 'object') {
              timeStr = time.toString();
              if (!timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
                if (timeStr.match(/^\d{2}:\d{2}$/)) {
                  timeStr = timeStr + ':00';
                }
              }
            }
            
            const capacity = row.capacity || 5;
            const bookedCount = bookedCounts[timeStr] || 0;
            
            return {
              time: timeStr,
              capacity: capacity,
              booked: bookedCount,
              available: bookedCount < capacity
            };
          })
          .filter(slot => slot.available && slot.time)
          .map(slot => slot.time);

        callback(null, availableSlots);
      });
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
  // IMPORTANT: Only update slots that don't already have an order_item_id
  // This prevents overwriting existing order links
  updateSlotWithOrder: (slotId, orderItemId, callback) => {
    const sql = `
      UPDATE appointment_slots 
      SET order_item_id = ?, cart_item_id = NULL
      WHERE slot_id = ? AND order_item_id IS NULL
    `;
    db.query(sql, [orderItemId, slotId, orderItemId], (err, result) => {
      if (err) {
        return callback(err);
      }
      // Log the update result for debugging
      if (result && result.affectedRows === 0) {
        console.warn(`[APPOINTMENT SLOT] Slot ${slotId} update affected 0 rows. May already be linked to order_item_id ${orderItemId} or slot doesn't exist.`);
      } else if (result && result.affectedRows > 0) {
        console.log(`[APPOINTMENT SLOT] ✅ Successfully updated slot ${slotId} with order_item_id ${orderItemId} (affectedRows: ${result.affectedRows})`);
      }
      callback(err, result);
    });
  },

  // Get slot by cart item ID
  // IMPORTANT: Only return slots that don't already have an order_item_id
  // This prevents reusing slots that are already linked to orders
  getSlotByCartItem: (cartItemId, callback) => {
    if (cartItemId) {
      const sql = `SELECT * FROM appointment_slots WHERE cart_item_id = ? AND status = 'booked' AND order_item_id IS NULL`;
      db.query(sql, [cartItemId], callback);
    } else {
      // Get all booked slots without cart_item_id and without order_item_id (for linking)
      const sql = `SELECT * FROM appointment_slots WHERE cart_item_id IS NULL AND order_item_id IS NULL AND status = 'booked' ORDER BY created_at DESC`;
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

  // Cancel slot by order item ID (when order is rejected/cancelled)
  cancelSlotByOrderItem: (orderItemId, callback) => {
    console.log(`[APPOINTMENT SLOT] Attempting to cancel slots for order item ${orderItemId}`);
    // First, try to cancel by order_item_id
    const sqlByOrderItem = `UPDATE appointment_slots SET status = 'cancelled' WHERE order_item_id = ? AND status = 'booked'`;
    
    db.query(sqlByOrderItem, [orderItemId], (err, result) => {
      if (err) {
        console.error(`[APPOINTMENT SLOT] Error cancelling by order_item_id:`, err);
        return callback(err);
      }
      
      console.log(`[APPOINTMENT SLOT] Cancelled ${result.affectedRows} slot(s) by order_item_id for order item ${orderItemId}`);
      
      // If no slots were cancelled by order_item_id, try to get the order item details
      // and cancel by matching appointment date/time, service type, and user_id
      if (result.affectedRows === 0) {
        console.log(`[APPOINTMENT SLOT] No slots found by order_item_id, trying fallback method for order item ${orderItemId}`);
        
        // First, check if there are any slots with cart_item_id that might need to be linked
        // This can happen if the order was created but slots weren't properly linked
        const checkCartSlotsSql = `
          SELECT slot_id, cart_item_id, appointment_date, appointment_time, service_type, user_id, status
          FROM appointment_slots
          WHERE user_id IN (
            SELECT o.user_id 
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE oi.item_id = ?
          )
          AND status = 'booked'
        `;
        
        db.query(checkCartSlotsSql, [orderItemId], (checkErr, cartSlots) => {
          if (!checkErr && cartSlots && cartSlots.length > 0) {
            console.log(`[APPOINTMENT SLOT] Found ${cartSlots.length} booked slot(s) for this user that might need cancellation`);
          }
        });
        
        // Get order item details and use MySQL functions to extract date and time
        // Also get user_id and order_date from the order to match the correct user's slot
        // First get the order item without the appointment_date filter
        const getOrderItemSql = `
          SELECT 
            DATE(oi.appointment_date) as appointment_date_only,
            TIME(oi.appointment_date) as appointment_time_only,
            oi.service_type,
            o.user_id,
            oi.appointment_date as full_appointment_date,
            oi.item_id,
            o.order_date
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          WHERE oi.item_id = ?
        `;
        
        db.query(getOrderItemSql, [orderItemId], (err2, orderItemResults) => {
          if (err2) {
            console.error(`[APPOINTMENT SLOT] Error fetching order item ${orderItemId}:`, err2);
            return callback(err2);
          }
          
          if (!orderItemResults || orderItemResults.length === 0) {
            console.log(`[APPOINTMENT SLOT] Order item ${orderItemId} not found in database`);
            return callback(null, result);
          }
          
          const orderItem = orderItemResults[0];
          console.log(`[APPOINTMENT SLOT] Order item ${orderItemId} details:`, {
            appointment_date_only: orderItem.appointment_date_only,
            appointment_time_only: orderItem.appointment_time_only,
            service_type: orderItem.service_type,
            user_id: orderItem.user_id,
            full_appointment_date: orderItem.full_appointment_date
          });
          
          if (!orderItem.appointment_date_only || !orderItem.appointment_time_only) {
            console.log(`[APPOINTMENT SLOT] ⚠️ Order item ${orderItemId} has no appointment_date in database. Trying to cancel the most recent unlinked slot for this user and service type.`);
            
            // If no appointment_date, try to cancel the most recent booked slot for this user and service type
            // Priority: 1) slots with matching order_item_id, 2) unlinked slots (no order_item_id)
            // Order by most recent first to get the slot that was likely created for this order
            const sqlByUserAndService = `
              UPDATE appointment_slots 
              SET status = 'cancelled' 
              WHERE user_id = ? 
              AND service_type = ? 
              AND status = 'booked'
              AND (order_item_id = ? OR order_item_id IS NULL)
              ORDER BY 
                CASE WHEN order_item_id = ? THEN 1 ELSE 2 END,
                created_at DESC
              LIMIT 10
            `;
            
            console.log(`[APPOINTMENT SLOT] Query parameters: user_id=${orderItem.user_id}, service_type=${orderItem.service_type}, order_item_id=${orderItemId}`);
            
            db.query(sqlByUserAndService, [
              orderItem.user_id, 
              orderItem.service_type, 
              orderItemId,
              orderItemId
            ], (err4, result3) => {
              if (err4) {
                console.error('[APPOINTMENT SLOT] Error cancelling slots by user/service:', err4);
                return callback(err4);
              }
              
              if (result3.affectedRows > 0) {
                console.log(`[APPOINTMENT SLOT] ✅ Cancelled ${result3.affectedRows} slot(s) by user_id/service_type for order item ${orderItemId}`);
              } else {
                console.log(`[APPOINTMENT SLOT] ⚠️ No slots found to cancel for order item ${orderItemId} (user_id: ${orderItem.user_id}, service_type: ${orderItem.service_type})`);
                console.log(`[APPOINTMENT SLOT] Note: Found 20+ booked slots for this user, but none matched the criteria (order_item_id=${orderItemId} OR order_item_id IS NULL)`);
                
                // Debug: Check what slots actually exist for this user
                const debugSql = `
                  SELECT slot_id, order_item_id, cart_item_id, appointment_date, appointment_time, status, created_at
                  FROM appointment_slots
                  WHERE user_id = ? AND service_type = ? AND status = 'booked'
                  ORDER BY created_at DESC
                  LIMIT 5
                `;
                db.query(debugSql, [orderItem.user_id, orderItem.service_type], (debugErr, debugResults) => {
                  if (!debugErr && debugResults && debugResults.length > 0) {
                    console.log(`[APPOINTMENT SLOT] Sample slots for this user:`, debugResults.map(s => ({
                      slot_id: s.slot_id,
                      order_item_id: s.order_item_id,
                      cart_item_id: s.cart_item_id,
                      date: s.appointment_date,
                      time: s.appointment_time
                    })));
                  }
                });
              }
              callback(null, result3);
            });
            return;
          }
          
          // Cancel slots matching by date, time, service type, and user_id
          // This ensures we only cancel the correct user's slot
          // Cancel regardless of whether they have order_item_id or cart_item_id set
          const sqlByDateTime = `
            UPDATE appointment_slots 
            SET status = 'cancelled' 
            WHERE appointment_date = ? 
            AND appointment_time = ? 
            AND service_type = ? 
            AND user_id = ?
            AND status = 'booked'
          `;
          
          console.log(`[APPOINTMENT SLOT] Attempting to cancel slots by date/time/user:`, {
            date: orderItem.appointment_date_only,
            time: orderItem.appointment_time_only,
            service_type: orderItem.service_type,
            user_id: orderItem.user_id
          });
          
          db.query(sqlByDateTime, [orderItem.appointment_date_only, orderItem.appointment_time_only, orderItem.service_type, orderItem.user_id], (err3, result2) => {
            if (err3) {
              console.error('[APPOINTMENT SLOT] Error cancelling slots by date/time/user:', err3);
              return callback(err3);
            }
            
            if (result2.affectedRows > 0) {
              console.log(`[APPOINTMENT SLOT] ✅ Cancelled ${result2.affectedRows} slot(s) by matching date/time/user for order item ${orderItemId}`);
            } else {
              console.log(`[APPOINTMENT SLOT] ⚠️ No slots found to cancel for order item ${orderItemId} with date ${orderItem.appointment_date_only}, time ${orderItem.appointment_time_only}, service ${orderItem.service_type}, user ${orderItem.user_id}`);
            }
            callback(null, result2);
          });
        });
      } else {
        console.log(`Cancelled ${result.affectedRows} slot(s) by order_item_id for order item ${orderItemId}`);
        callback(null, result);
      }
    });
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

  // Check if date is valid (checks shop schedule)
  isValidDate: (dateString, callback) => {
    // If callback is provided, use async check with database
    if (callback) {
      const ShopSchedule = require('./ShopScheduleModel');
      ShopSchedule.isDateOpen(dateString, (err, isOpen) => {
        if (err) {
          console.error('Error checking shop schedule:', err);
          // Fallback to default (Monday-Saturday) if error
          // Parse date properly to avoid timezone issues
          const dateParts = dateString.split('-');
          let day;
          if (dateParts.length === 3) {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const dayNum = parseInt(dateParts[2], 10);
            const date = new Date(year, month, dayNum);
            day = date.getDay();
          } else {
            const date = new Date(dateString);
            day = date.getDay();
          }
          return callback(null, day >= 1 && day <= 6);
        }
        callback(null, isOpen);
      });
    } else {
      // Synchronous fallback (for backward compatibility)
      // Parse date properly to avoid timezone issues
      const dateParts = dateString.split('-');
      let day;
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const dayNum = parseInt(dateParts[2], 10);
        const date = new Date(year, month, dayNum);
        day = date.getDay();
      } else {
        const date = new Date(dateString);
        day = date.getDay();
      }
      return day >= 1 && day <= 6; // Monday (1) to Saturday (6)
    }
  }
};

module.exports = AppointmentSlot;

