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
  }
};

module.exports = Order;
