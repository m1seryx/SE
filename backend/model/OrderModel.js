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
      const itemValues = cartItems.map(item => [
        orderId,
        item.service_type,
        item.service_id,
        item.quantity || 1,
        item.base_price,
        item.final_price,
        item.appointment_date,
        item.rental_start_date,
        item.rental_end_date,
        item.pricing_factors || '{}',
        item.specific_data || '{}'
      ]);

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

        // Initialize tracking for each order item
        const OrderTracking = require('./OrderTrackingModel');
        const orderItems = cartItems.map((item, index) => ({
          order_item_id: itemResult.insertId + index, // This is approximate, better to get actual IDs
          service_type: item.service_type
        }));

        // Initialize tracking (async, don't wait for completion)
        OrderTracking.initializeOrderTracking(orderItems, (trackingErr) => {
          if (trackingErr) {
            console.error('Error initializing order tracking:', trackingErr);
          }
        });

        callback(null, {
          orderId: orderId,
          orderResult: orderResult,
          itemResult: itemResult
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
      SELECT * FROM order_items WHERE item_id = ?
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

        // First check if tracking entry exists
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
      DATE_FORMAT(oi.rental_end_date, '%Y-%m-%d') as rental_end_date
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
  const { finalPrice, approvalStatus, adminNotes } = updateData;

  console.log("Model - Updating rental item:", itemId, updateData);

  let updates = [];
  let values = [];

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
      const notes = getRentalStatusNote(approvalStatus);

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
