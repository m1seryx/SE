const db = require('../config/db');

const Order = {
  // Create order from cart items
  createFromCart: (userId, cartItems, totalPrice, notes, callback) => {
    const orderSql = `
      INSERT INTO orders (user_id, total_price, status, order_date, notes)
      VALUES (?, ?, 'pending', NOW(), ?)
    `;

    db.query(orderSql, [userId, totalPrice, notes], (err, orderResult) => {
      if (err) {
        return callback(err, null);
      }

      const orderId = orderResult.insertId;

      // Insert order items
      const itemValues = cartItems.map(item => {
        let pricingFactors = item.pricing_factors || '{}';
        
        // For rental services, ensure downpayment is 50% of final price
        if (item.service_type === 'rental') {
          try {
            const factors = typeof pricingFactors === 'string' ? JSON.parse(pricingFactors) : pricingFactors;
            const totalPrice = parseFloat(item.final_price || 0);
            const expectedDownpayment = totalPrice * 0.5;
            
            // Update downpayment to 50% of total price
            factors.downpayment = expectedDownpayment.toString();
            factors.down_payment = expectedDownpayment.toString();
            
            pricingFactors = JSON.stringify(factors);
          } catch (e) {
            console.error('Error parsing pricing factors for rental:', e);
          }
        }
        
        return [
          orderId,
          item.service_type,
          item.service_id,
          item.quantity || 1,
          item.base_price,
          item.final_price,
          item.appointment_date,
          item.rental_start_date,
          item.rental_end_date,
          pricingFactors,
          item.specific_data || '{}'
        ];
      });

      const itemSql = `
        INSERT INTO order_items (
          order_id, service_type, service_id, quantity, base_price, final_price,
          appointment_date, rental_start_date, rental_end_date, pricing_factors, specific_data
        ) VALUES ?
      `;

      db.query(itemSql, [itemValues], (itemErr, itemResult) => {
        if (itemErr) {
          return callback(itemErr, null);
        }

        // Get the actual order item IDs that were just inserted
        // We need to fetch them to link appointment slots properly
        const getOrderItemsSql = `
          SELECT item_id, service_type, appointment_date, specific_data
          FROM order_items
          WHERE order_id = ?
          ORDER BY item_id ASC
        `;
        
        db.query(getOrderItemsSql, [orderId], (getItemsErr, orderItems) => {
          // Link appointment slots from cart_item_id to order_item_id
          const AppointmentSlot = require('./AppointmentSlotModel');
          
          // Link slots for each cart item to its corresponding order item
          // Match by index (cart items and order items should be in the same order)
          let linkedCount = 0;
          const totalAppointmentItems = cartItems.filter(item => 
            ['dry_cleaning', 'repair', 'customization'].includes(item.service_type)
          ).length;
          
          // Link slots synchronously - wait for all to complete before continuing
          const linkSlotPromises = [];
          
          if (!getItemsErr && orderItems) {
            
            cartItems.forEach((cartItem, index) => {
              if (!cartItem || !cartItem.cart_id) return;
              
              const orderItem = orderItems[index];
              if (!orderItem) return;
              
              // Only link for appointment-based services
              if (['dry_cleaning', 'repair', 'customization'].includes(cartItem.service_type)) {
                // Create a promise for this slot linking operation
                const linkPromise = new Promise((resolve) => {
                  // Find slot by cart_item_id and link it to order_item_id
                  AppointmentSlot.getSlotByCartItem(cartItem.cart_id, (slotErr, slots) => {
                    if (slotErr) {
                      console.error(`[ORDER] Error getting slot by cart item ${cartItem.cart_id}:`, slotErr);
                      resolve(false);
                      return;
                    }
                    
                    // Filter out slots that already have an order_item_id (already linked)
                    const unlinkedSlots = slots ? slots.filter(s => !s.order_item_id) : [];
                    
                    if (!unlinkedSlots || unlinkedSlots.length === 0) {
                      console.warn(`[ORDER] ⚠️ No slot found for cart_item_id ${cartItem.cart_id}, service_type: ${cartItem.service_type}`);
                      console.warn(`[ORDER] This means the slot was not linked to cart item. Checking for unlinked slots...`);
                      
                      // Try to find slot by user_id, service_type, date, and time from specific_data
                      const appointmentDate = cartItem.specific_data?.pickupDate || cartItem.specific_data?.preferredDate;
                      const appointmentTime = cartItem.specific_data?.appointmentTime || cartItem.specific_data?.pickupDate?.split('T')[1]?.substring(0, 8);
                      
                      if (appointmentDate && appointmentTime) {
                        const datePart = appointmentDate.includes('T') ? appointmentDate.split('T')[0] : appointmentDate;
                        const timePart = appointmentTime.includes(':') && appointmentTime.split(':').length === 3 
                          ? appointmentTime 
                          : appointmentTime + ':00';
                        
                        console.log(`[ORDER] Attempting to find slot by date/time: ${datePart}, ${timePart}`);
                        
                        // Try to find unlinked slot for this user/date/time
                        const db = require('../config/db');
                        const findSlotSql = `
                          SELECT * FROM appointment_slots 
                          WHERE user_id = ? 
                          AND service_type = ? 
                          AND appointment_date = ? 
                          AND appointment_time = ? 
                          AND (cart_item_id = ? OR (cart_item_id IS NULL AND order_item_id IS NULL))
                          AND status = 'booked'
                          ORDER BY created_at DESC
                          LIMIT 1
                        `;
                        db.query(findSlotSql, [cartItem.user_id || null, cartItem.service_type, datePart, timePart, cartItem.cart_id], (findErr, foundSlots) => {
                          if (findErr || !foundSlots || foundSlots.length === 0) {
                            console.error(`[ORDER] Could not find any matching slot for cart_item_id ${cartItem.cart_id}`);
                            resolve(false);
                          } else {
                            const slot = foundSlots[0];
                            console.log(`[ORDER] Found unlinked slot ${slot.slot_id} for cart_item_id ${cartItem.cart_id}`);
                            AppointmentSlot.updateSlotWithOrder(slot.slot_id, orderItem.item_id, (linkErr, updateResult) => {
                              if (linkErr) {
                                console.error(`[ORDER] Error linking slot ${slot.slot_id} to order item ${orderItem.item_id}:`, linkErr);
                                resolve(false);
                              } else {
                                linkedCount++;
                                console.log(`[ORDER] ✅ Linked slot ${slot.slot_id} to order item ${orderItem.item_id} (fallback method)`);
                                resolve(true);
                              }
                            });
                          }
                        });
                      } else {
                        resolve(false);
                      }
                      return;
                    }
                    
                    const slot = unlinkedSlots[0];
                    console.log(`[ORDER] Found slot ${slot.slot_id} for cart_item_id ${cartItem.cart_id}`);
                    console.log(`[ORDER] Slot details: slot_id=${slot.slot_id}, date=${slot.appointment_date}, time=${slot.appointment_time}, service_type=${slot.service_type}, current_order_item_id=${slot.order_item_id || 'NULL'}, current_cart_item_id=${slot.cart_item_id || 'NULL'}`);
                    
                    // Link the slot to order item (skip availability check on order submission)
                    AppointmentSlot.updateSlotWithOrder(slot.slot_id, orderItem.item_id, (linkErr, updateResult) => {
                      if (linkErr) {
                        console.error(`[ORDER] Error linking slot ${slot.slot_id} to order item ${orderItem.item_id}:`, linkErr);
                        resolve(false);
                      } else {
                        linkedCount++;
                        console.log(`[ORDER] ✅ Linked slot ${slot.slot_id} (${slot.appointment_date} ${slot.appointment_time}) to order item ${orderItem.item_id} (from cart_item_id ${cartItem.cart_id})`);
                        console.log(`[ORDER] Update result:`, updateResult?.affectedRows || 'unknown');
                        resolve(true);
                      }
                    });
                  });
                });
                
                linkSlotPromises.push(linkPromise);
              }
            });
          }

          // Wait for all slot linking operations to complete before calling callback
          if (linkSlotPromises.length > 0) {
            Promise.all(linkSlotPromises).then(() => {
              console.log(`[ORDER] Slot linking completed. Linked ${linkedCount} out of ${totalAppointmentItems} appointment slots.`);
              
              // Initialize tracking after slots are linked
              const OrderTracking = require('./OrderTrackingModel');
              const trackingItems = orderItems ? orderItems.map((item) => ({
                order_item_id: item.item_id,
                service_type: item.service_type
              })) : cartItems.map((item, index) => ({
                order_item_id: itemResult.insertId + index, // Fallback if orderItems not available
                service_type: item.service_type
              }));

              // Initialize tracking (async, don't wait for completion)
              OrderTracking.initializeOrderTracking(trackingItems, (trackingErr) => {
                if (trackingErr) {
                  console.error('Error initializing order tracking:', trackingErr);
                }
              });

              callback(null, {
                orderId: orderId,
                orderResult: orderResult,
                itemResult: itemResult
              });
            }).catch((err) => {
              console.error('[ORDER] Error during slot linking:', err);
              // Still call callback even if slot linking had errors
              callback(null, {
                orderId: orderId,
                orderResult: orderResult,
                itemResult: itemResult
              });
            });
          } else {
            // No appointment slots to link, proceed immediately
            const OrderTracking = require('./OrderTrackingModel');
            const trackingItems = orderItems ? orderItems.map((item) => ({
              order_item_id: item.item_id,
              service_type: item.service_type
            })) : cartItems.map((item, index) => ({
              order_item_id: itemResult.insertId + index, // Fallback if orderItems not available
              service_type: item.service_type
            }));

            // Initialize tracking (async, don't wait for completion)
            OrderTracking.initializeOrderTracking(trackingItems, (trackingErr) => {
              if (trackingErr) {
                console.error('Error initializing order tracking:', trackingErr);
              }
            });

            callback(null, {
              orderId: orderId,
              orderResult: orderResult,
              itemResult: itemResult
            });
          }
        });
      });
    });
  },

  // Get orders by user
  getByUser: (userId, callback) => {
    const sql = `
      SELECT 
        o.*,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      JOIN user u ON o.user_id = u.user_id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Get all orders (for admin)
  getAll: (callback) => {
    const sql = `
      SELECT 
        o.*,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM orders o
      JOIN user u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
    `;
    db.query(sql, callback);
  },

  // Get order by ID
  getById: (orderId, callback) => {
    const sql = `
      SELECT 
        o.*,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      JOIN user u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `;
    db.query(sql, [orderId], callback);
  },

  // Get order items
  getOrderItems: (orderId, callback) => {
    const sql = `
      SELECT 
        oi.*,
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
        DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
        DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.item_id ASC
    `;
    db.query(sql, [orderId], callback);
  },

  // Get single order item by ID
  getOrderItemById: (itemId, callback) => {
    const sql = `
      SELECT oi.*, o.user_id, DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
             u.first_name, u.last_name
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.order_id 
      LEFT JOIN user u ON o.user_id = u.user_id
      WHERE oi.item_id = ?
    `;
    db.query(sql, [itemId], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null);
      callback(null, results[0]);
    });
  },

  // Get full order with items
  getFullOrderById: (orderId, callback) => {
    Order.getById(orderId, (err, orderResult) => {
      if (err) {
        return callback(err, null);
      }

      if (orderResult.length === 0) {
        return callback(null, null);
      }

      const order = orderResult[0];

      Order.getOrderItems(orderId, (itemErr, itemResults) => {
        if (itemErr) {
          return callback(itemErr, null);
        }

        // Parse JSON fields for items
        const items = itemResults.map(item => ({
          ...item,
          pricing_factors: JSON.parse(item.pricing_factors || '{}'),
          specific_data: JSON.parse(item.specific_data || '{}')
        }));

        order.items = items;
        callback(null, order);
      });
    });
  },

  // Update order status
  updateStatus: (orderId, status, callback) => {
    const sql = `
      UPDATE orders 
      SET status = ?
      WHERE order_id = ?
    `;
    db.query(sql, [status, orderId], callback);
  },

  // Cancel order
  cancelOrder: (orderId, reason, callback) => {
    const sql = `
      UPDATE orders 
      SET status = 'cancelled', notes = CONCAT(IFNULL(notes, ''), ' | Cancelled: ', ?)
      WHERE order_id = ?
    `;
    db.query(sql, [reason, orderId], callback);
  },

  // Update order item approval status
  updateItemApprovalStatus: (itemId, status, callback) => {
    const sql = `
      UPDATE order_items 
      SET approval_status = ?
      WHERE item_id = ?
    `;
    db.query(sql, [status, itemId], callback);
  },

  // Cancel order item (individual item, not entire order)
  cancelOrderItem: (itemId, reason, callback) => {
    // First get current status
    Order.getOrderItemById(itemId, (err, item) => {
      if (err) {
        return callback(err, null);
      }
      if (!item) {
        return callback(new Error('Order item not found'), null);
      }

      const previousStatus = item.approval_status || item.status || 'pending';
      
      // Update order item status to cancelled
      const sql = `
        UPDATE order_items 
        SET approval_status = 'cancelled'
        WHERE item_id = ?
      `;
      db.query(sql, [itemId], (updateErr, updateResult) => {
        if (updateErr) {
          return callback(updateErr, null);
        }
        callback(null, { previousStatus, updateResult });
      });
    });
  },

  // Get orders by status
  getByStatus: (status, callback) => {
    const sql = `
      SELECT 
        o.*,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      JOIN user u ON o.user_id = u.user_id
      WHERE o.status = ?
      ORDER BY o.order_date DESC
    `;
    db.query(sql, [status], callback);
  },

  // Get pending approval items
  getPendingApprovalItems: (callback) => {
    const sql = `
      SELECT 
        oi.*,
        o.order_id,
        o.user_id,
        u.first_name,
        u.last_name,
        u.email,
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
        DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
        DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN user u ON o.user_id = u.user_id
      WHERE oi.approval_status = 'pending_review'
      ORDER BY oi.item_id ASC
    `;
    db.query(sql, callback);
  },

  // Get repair orders specifically
  getRepairOrders: (callback) => {
    const sql = `
      SELECT 
        oi.*,
        o.order_id,
        o.user_id,
        o.status as order_status,
        o.notes as order_notes,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
        DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
        DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN user u ON o.user_id = u.user_id
      WHERE oi.service_type = 'repair'
      ORDER BY o.order_date DESC
    `;
    db.query(sql, callback);
  },

  // Get repair orders by status
  getRepairOrdersByStatus: (status, callback) => {
    const sql = `
      SELECT 
        oi.*,
        o.order_id,
        o.user_id,
        o.status as order_status,
        o.notes as order_notes,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
        DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
        DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN user u ON o.user_id = u.user_id
      WHERE oi.service_type = 'repair' AND (o.status = ? OR oi.approval_status = ?)
      ORDER BY o.order_date DESC
    `;
    db.query(sql, [status, status], callback);
  },

  // Get dry cleaning orders specifically
  getDryCleaningOrders: (callback) => {
    const sql = `
      SELECT 
        oi.*,
        o.order_id,
        o.user_id,
        o.status as order_status,
        o.notes as order_notes,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
        DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
        DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN user u ON o.user_id = u.user_id
      WHERE oi.service_type IN ('dry_cleaning', 'drycleaning', 'dry-cleaning', 'dry cleaning')
      ORDER BY o.order_date DESC
    `;
    db.query(sql, callback);
  },

  // Get dry cleaning orders by status
  getDryCleaningOrdersByStatus: (status, callback) => {
    const sql = `
      SELECT 
        oi.*,
        o.order_id,
        o.user_id,
        o.status as order_status,
        o.notes as order_notes,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
        DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
        DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN user u ON o.user_id = u.user_id
      WHERE oi.service_type IN ('dry_cleaning', 'drycleaning', 'dry-cleaning', 'dry cleaning') 
      AND (o.status = ? OR oi.approval_status = ?)
      ORDER BY o.order_date DESC
    `;
    db.query(sql, [status, status], callback);
  },

  // Update dry cleaning order item price and status (Reuse logic but specific method for clarity)
  updateDryCleaningOrderItem: (itemId, updateData, callback) => {
    // This reuses the same logic as repair since the underlying table structure is the same
    Order.updateRepairOrderItem(itemId, updateData, callback);
  },

  // Update repair order item price and status
  updateRepairOrderItem: (itemId, updateData, callback) => {
    const { finalPrice, approvalStatus, adminNotes } = updateData;

    console.log("Model - Updating item:", itemId, updateData);

    // Build dynamic SQL based on what fields are provided
    let updates = [];
    let values = [];

    if (finalPrice !== undefined) {
      updates.push('final_price = ?');
      values.push(finalPrice);
      console.log("Adding final_price update:", finalPrice);
    }

    if (approvalStatus !== undefined) {
      updates.push('approval_status = ?');
      values.push(approvalStatus);
      console.log("Adding approval_status update:", approvalStatus);
    }

    if (adminNotes !== undefined) {
      updates.push('pricing_factors = JSON_SET(pricing_factors, \'$.adminNotes\', ?)');
      values.push(adminNotes || '');
      console.log("Adding adminNotes update:", adminNotes);
    }

    // If final price is being updated, set adminPriceUpdated flag
    if (finalPrice !== undefined) {
      updates.push('pricing_factors = JSON_SET(pricing_factors, \'$.adminPriceUpdated\', true)');
      console.log("Setting adminPriceUpdated flag");
    }

    if (updates.length === 0) {
      return callback(new Error('No fields to update'));
    }

    values.push(itemId);

    const sql = `UPDATE order_items SET ${updates.join(', ')} WHERE item_id = ?`;
    console.log("Model - SQL:", sql);
    console.log("Model - Values:", values);

    db.query(sql, values, (err, result) => {
      console.log("Model - Query result:", err, result);

      if (err) {
        return callback(err);
      }

      // Get order item details to find user_id for notification
      const getOrderSql = `
        SELECT oi.*, o.user_id 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.item_id = ?
      `;
      
      db.query(getOrderSql, [itemId], (orderErr, orderResults) => {
        if (!orderErr && orderResults && orderResults.length > 0) {
          const orderItem = orderResults[0];
          const userId = orderItem.user_id;
          const Notification = require('./NotificationModel');
          
          // Create notification when price is updated and status is price_confirmation
          if (finalPrice !== undefined && approvalStatus === 'price_confirmation') {
            Notification.createPriceConfirmationNotification(userId, itemId, finalPrice, (notifErr) => {
              if (notifErr) console.error('Failed to create price confirmation notification:', notifErr);
            });
          }
          
          // Create notification when order is accepted
          if (approvalStatus === 'accepted') {
            Notification.createAcceptedNotification(userId, itemId, orderItem.service_type, (notifErr) => {
              if (notifErr) console.error('Failed to create accepted notification:', notifErr);
            });
          }

          // Create generic status update notifications for in-progress / ready / completed states
          const statusNotificationStatuses = [
            'confirmed',
            'in_progress',
            'ready_for_pickup',
            'ready_to_pickup',
            'completed'
          ];

          if (approvalStatus && statusNotificationStatuses.includes(approvalStatus)) {
            // Map admin status to notification status key
            const statusForNotification =
              approvalStatus === 'confirmed' ? 'in_progress' :
              approvalStatus === 'ready_for_pickup' ? 'ready_to_pickup' :
              approvalStatus === 'ready_to_pickup' ? 'ready_to_pickup' :
              approvalStatus;

            const serviceType = (orderItem.service_type || 'repair').toLowerCase().trim();
            Notification.createStatusUpdateNotification(
              userId,
              itemId,
              statusForNotification,
              null,
              serviceType,
              (notifErr) => {
                if (notifErr) console.error('Failed to create status update notification:', notifErr);
              }
            );
          }
        }

        // Continue with existing tracking logic
        continueWithTracking();
      });

      function continueWithTracking() {

      // If approval status was updated, also update the order_tracking table
      if (approvalStatus !== undefined) {
        console.log("Approval status was updated, syncing to tracking table...");
        const OrderTracking = require('./OrderTrackingModel');

        // Map approval_status to tracking status
        const statusMap = {
          'pending_review': 'pending',
          'pending': 'pending',
          'accepted': 'accepted',
          'price_confirmation': 'price_confirmation',
          'confirmed': 'in_progress',
          'ready_for_pickup': 'ready_to_pickup',
          'completed': 'completed',
          'cancelled': 'cancelled',
          'price_declined': 'cancelled'
        };

        const trackingStatus = statusMap[approvalStatus] || 'pending';
        const notes = getStatusNote(approvalStatus);

        console.log("Syncing to tracking table:", itemId, "from", approvalStatus, "to", trackingStatus);
        console.log("Status map:", statusMap);
        console.log("Approval status:", approvalStatus);
        console.log("Tracking status:", trackingStatus);

        
        OrderTracking.getByOrderItemId(itemId, (err, existingTracking) => {
        
          if (err) {
            console.error("Error checking existing tracking:", err);
            callback(null, result);
            return;
          }

          console.log("Existing tracking:", existingTracking);

          if (existingTracking && existingTracking.length > 0) {
            // Update existing tracking
            console.log("Updating existing tracking entry...");
            OrderTracking.updateStatus(itemId, trackingStatus, notes, null, (trackingErr, trackingResult) => {
              if (trackingErr) {
                console.error("Failed to update tracking table:", trackingErr);
              } else {
                console.log("Successfully updated tracking table:", trackingResult);
              }
              callback(null, result);
            });
          } else {
            // Create new tracking entry
            console.log("Creating new tracking entry...");
            OrderTracking.addTracking(itemId, trackingStatus, notes, null, (trackingErr, trackingResult) => {
              if (trackingErr) {
                console.error("Failed to create tracking entry:", trackingErr);
              } else {
                console.log("Successfully created tracking entry");
              }
              callback(null, result);
            });
          }
        });
      } else {
        // No status update needed, return main result
        callback(null, result);
      }
      } // End of continueWithTracking
    });
  }
};

// Helper function to get status notes for tracking
function getStatusNote(approvalStatus) {
  const notesMap = {
    'pending_review': 'Order pending review',
    'pending': 'Order pending review',
    'accepted': 'Order accepted by admin',
    'price_confirmation': 'Price confirmation needed from user',
    'confirmed': 'Order approved and in progress',
    'ready_for_pickup': 'Order ready for pickup',
    'completed': 'Order completed',
    'cancelled': 'Order cancelled',
    'price_declined': 'User declined the proposed price'
  };
  return notesMap[approvalStatus] || 'Status updated';
}

// Get rental orders specifically
Order.getRentalOrders = (callback) => {
  const sql = `
    SELECT 
      oi.*,
      o.order_id,
      o.user_id,
      o.status as order_status,
      o.notes as order_notes,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number,
      DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
      DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
      DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
      DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date,
      COALESCE(
        (SELECT ot.status 
         FROM order_tracking ot 
         WHERE ot.order_item_id = oi.item_id 
         ORDER BY ot.created_at DESC 
         LIMIT 1), 
        oi.approval_status
      ) as approval_status
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN user u ON o.user_id = u.user_id
    WHERE oi.service_type = 'rental'
    ORDER BY o.order_date DESC
  `;
  db.query(sql, callback);
};

// Get rental orders by status
Order.getRentalOrdersByStatus = (status, callback) => {
  const sql = `
    SELECT 
      oi.*,
      o.order_id,
      o.user_id,
      o.status as order_status,
      o.notes as order_notes,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number,
      DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
      DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date,
      DATE_FORMAT(oi.rental_start_date, '%Y-%m-%d') as rental_start_date,
      DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN user u ON o.user_id = u.user_id
    WHERE oi.service_type = 'rental' 
    AND (o.status = ? OR oi.approval_status = ?)
    ORDER BY o.order_date DESC
  `;
  db.query(sql, [status, status], callback);
};

// Update rental order item status (rental has different status flow)
Order.updateRentalOrderItem = (itemId, updateData, callback) => {
  const { finalPrice, approvalStatus, adminNotes, penaltyData, damageNotes } = updateData;

  console.log("Model - Updating rental item:", itemId, updateData);

  let updates = [];
  let values = [];

  if (approvalStatus !== undefined) {
    updates.push('approval_status = ?');
    values.push(approvalStatus);
    console.log("Adding approval_status update:", approvalStatus);
  }

  if (adminNotes !== undefined) {
    updates.push('pricing_factors = JSON_SET(COALESCE(pricing_factors, \'{}\'), \'$.adminNotes\', ?)');
    values.push(adminNotes || '');
    console.log("Adding adminNotes update:", adminNotes);
  }

  // Handle damage notes - store in specific_data
  if (damageNotes !== undefined) {
    if (damageNotes === null || damageNotes === '') {
      // Remove damage notes if null or empty
      updates.push('specific_data = JSON_REMOVE(COALESCE(specific_data, \'{}\'), \'$.damageNotes\')');
      console.log("Removing damageNotes from specific_data");
    } else {
      updates.push('specific_data = JSON_SET(COALESCE(specific_data, \'{}\'), \'$.damageNotes\', ?)');
      values.push(damageNotes);
      console.log("Adding damageNotes update:", damageNotes);
    }
  }

  // If penalty data is provided, update pricing_factors with penalty information
  if (penaltyData !== undefined) {
    // Use JSON_MERGE_PATCH or multiple JSON_SET calls to update all penalty fields
    updates.push('pricing_factors = JSON_SET(COALESCE(pricing_factors, \'{}\'), \'$.penalty\', CAST(? AS DECIMAL(10,2)))');
    values.push(penaltyData.penalty || 0);
    updates.push('pricing_factors = JSON_SET(pricing_factors, \'$.penaltyDays\', ?)');
    values.push(penaltyData.penaltyDays || 0);
    if (penaltyData.penaltyAppliedDate) {
      updates.push('pricing_factors = JSON_SET(pricing_factors, \'$.penaltyAppliedDate\', ?)');
      values.push(penaltyData.penaltyAppliedDate);
    }
    console.log("Adding penalty data to pricing_factors:", penaltyData);
  }

  // If final price is being updated (including penalty), update it
  if (finalPrice !== undefined) {
    updates.push('final_price = ?');
    values.push(finalPrice);
    updates.push('pricing_factors = JSON_SET(COALESCE(pricing_factors, \'{}\'), \'$.adminPriceUpdated\', true)');
    console.log("Updating final_price to:", finalPrice);
  }

  if (updates.length === 0) {
    return callback(new Error('No fields to update'));
  }

  values.push(itemId);

  const sql = `UPDATE order_items SET ${updates.join(', ')} WHERE item_id = ?`;
  console.log("Model - SQL:", sql);
  console.log("Model - Values:", values);

  db.query(sql, values, (err, result) => {
    console.log("Model - Query result:", err, result);

    if (err) {
      return callback(err);
    }

    // Get order item details to find user_id for notification
    const getOrderSql = `
      SELECT oi.*, o.user_id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE oi.item_id = ?
    `;
    
    db.query(getOrderSql, [itemId], (orderErr, orderResults) => {
      if (!orderErr && orderResults && orderResults.length > 0) {
        const orderItem = orderResults[0];
        const userId = orderItem.user_id;
        const Notification = require('./NotificationModel');
        
        // Create notification when price is updated and status is price_confirmation
        if (finalPrice !== undefined && approvalStatus === 'price_confirmation') {
          Notification.createPriceConfirmationNotification(userId, itemId, finalPrice, (notifErr) => {
            if (notifErr) console.error('Failed to create price confirmation notification:', notifErr);
          });
        }
        
        // Create notification when order is accepted
        if (approvalStatus === 'accepted') {
          Notification.createAcceptedNotification(userId, itemId, orderItem.service_type, (notifErr) => {
            if (notifErr) console.error('Failed to create accepted notification:', notifErr);
          });
        }

        // Create generic status update notifications for rental statuses
        const statusNotificationStatuses = [
          'confirmed',
          'in_progress',
          'ready_for_pickup',
          'ready_to_pickup',
          'rented',
          'returned',
          'completed'
        ];

        if (approvalStatus && statusNotificationStatuses.includes(approvalStatus)) {
          const statusForNotification =
            approvalStatus === 'confirmed' ? 'in_progress' :
            approvalStatus === 'ready_for_pickup' ? 'ready_to_pickup' :
            approvalStatus === 'ready_to_pickup' ? 'ready_to_pickup' :
            approvalStatus;

          const serviceType = (orderItem.service_type || 'rental').toLowerCase().trim();
          Notification.createStatusUpdateNotification(
            userId,
            itemId,
            statusForNotification,
            null,
            serviceType,
            (notifErr) => {
              if (notifErr) console.error('Failed to create status update notification:', notifErr);
            }
          );
        }
      }

      // Continue with existing tracking logic
      continueWithTracking();
    });

    function continueWithTracking() {
      // If approval status was updated, also update the order_tracking table
      if (approvalStatus !== undefined) {
        console.log("Approval status was updated, syncing to tracking table...");
        const OrderTracking = require('./OrderTrackingModel');

        // Map approval_status to tracking status for rental
        const statusMap = {
          'pending': 'pending',
          'ready_to_pickup': 'ready_to_pickup',
          'ready_for_pickup': 'ready_to_pickup',
          'picked_up': 'picked_up',
          'rented': 'rented',
          'returned': 'returned',
          'completed': 'completed',
          'cancelled': 'cancelled'
        };

        const trackingStatus = statusMap[approvalStatus] || 'pending';
        let notes = getRentalStatusNote(approvalStatus);
        
        // Add penalty information to notes if penalty was applied
        if (updateData.penaltyData && updateData.penaltyData.penalty > 0) {
          notes += ` | Penalty: ₱${updateData.penaltyData.penalty} (${updateData.penaltyData.penaltyDays} day${updateData.penaltyData.penaltyDays > 1 ? 's' : ''} exceeded)`;
        }

        console.log("Syncing to tracking table:", itemId, "from", approvalStatus, "to", trackingStatus);

        OrderTracking.getByOrderItemId(itemId, (err, existingTracking) => {
          if (err) {
            console.error("Error checking existing tracking:", err);
            callback(null, result);
            return;
          }

          console.log("Existing tracking:", existingTracking);

          if (existingTracking && existingTracking.length > 0) {
            console.log("Updating existing tracking entry...");
            OrderTracking.updateStatus(itemId, trackingStatus, notes, null, (trackingErr, trackingResult) => {
              if (trackingErr) {
                console.error("Failed to update tracking table:", trackingErr);
              } else {
                console.log("Successfully updated tracking table:", trackingResult);
              }
              callback(null, result);
            });
          } else {
            console.log("Creating new tracking entry...");
            OrderTracking.addTracking(itemId, trackingStatus, notes, null, (trackingErr, trackingResult) => {
              if (trackingErr) {
                console.error("Failed to create tracking entry:", trackingErr);
              } else {
                console.log("Successfully created tracking entry");
              }
              callback(null, result);
            });
          }
        });
      } else {
        callback(null, result);
      }
    }
  });
};

// Helper function to get status notes for rental
function getRentalStatusNote(approvalStatus) {
  const notesMap = {
    'pending': 'Rental order placed',
    'ready_to_pickup': 'Rental approved - Ready to pick up',
    'ready_for_pickup': 'Rental approved - Ready to pick up',
    'picked_up': 'Item picked up from store',
    'rented': 'Item currently rented',
    'returned': 'Item returned to store',
    'completed': 'Rental completed',
    'cancelled': 'Rental cancelled'
  };
  return notesMap[approvalStatus] || 'Status updated';
}

module.exports = Order;
