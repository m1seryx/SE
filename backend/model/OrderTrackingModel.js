const db = require('../config/db');

const OrderTracking = {
  // Get tracking status for an order item
  getByOrderItemId: (orderItemId, callback) => {
    const sql = `
      SELECT * FROM order_tracking 
      WHERE order_item_id = ? 
      ORDER BY created_at DESC
    `;
    db.query(sql, [orderItemId], callback);
  },

  // Get all tracking for a user's orders
  getByUserId: (userId, callback) => {
    const sql = `
      SELECT 
        oi.item_id as order_item_id,
        oi.order_id,
        oi.service_type,
        oi.final_price,
        oi.specific_data,
        ot.status,
        ot.notes,
        ot.created_at as status_updated_at,
        o.order_date,
        o.total_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN order_tracking ot ON oi.item_id = ot.order_item_id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC, oi.item_id DESC, ot.created_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Get latest status for each order item
  getLatestStatusByUserId: (userId, callback) => {
    const sql = `
      SELECT 
        oi.item_id as order_item_id,
        oi.order_id,
        oi.service_type,
        oi.final_price,
        oi.specific_data,
        IFNULL(latest_ot.status, 'pending') as status,
        IFNULL(latest_ot.notes, 'Order created') as notes,
        IFNULL(latest_ot.created_at, o.order_date) as status_updated_at,
        o.order_date,
        o.total_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN (
        SELECT 
          ot1.order_item_id,
          ot1.status,
          ot1.notes,
          ot1.created_at
        FROM order_tracking ot1
        INNER JOIN (
          SELECT order_item_id, MAX(created_at) as max_created_at
          FROM order_tracking
          GROUP BY order_item_id
        ) ot2 ON ot1.order_item_id = ot2.order_item_id 
             AND ot1.created_at = ot2.max_created_at
      ) latest_ot ON oi.item_id = latest_ot.order_item_id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC, oi.item_id DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Add or update tracking status
  addTracking: (orderItemId, status, notes, adminId, callback) => {
    const sql = `
      INSERT INTO order_tracking (order_item_id, status, notes, updated_by)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [orderItemId, status, notes, adminId], callback);
  },

  // Update tracking status
  updateStatus: (orderItemId, status, notes, adminId, callback) => {
    const sql = `
      INSERT INTO order_tracking (order_item_id, status, notes, updated_by)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [orderItemId, status, notes, adminId], callback);
  },

  // Get tracking history for a specific order item
  getTrackingHistory: (orderItemId, callback) => {
    const sql = `
      SELECT 
        ot.status,
        ot.notes,
        ot.created_at,
        u.name as updated_by_name
      FROM order_tracking ot
      LEFT JOIN users u ON ot.updated_by = u.user_id
      WHERE ot.order_item_id = ?
      ORDER BY ot.created_at ASC
    `;
    db.query(sql, [orderItemId], callback);
  },

  // Initialize tracking for new order items
  initializeOrderTracking: (orderItems, callback) => {
    if (!orderItems || orderItems.length === 0) {
      return callback(null, 'No order items to initialize');
    }

    // Process each order item
    let completed = 0;
    const errors = [];

    orderItems.forEach((item, index) => {
      const initialStatus = OrderTracking.getInitialStatus(item.service_type);
      const sql = `
        INSERT INTO order_tracking (order_item_id, status, notes, updated_by)
        VALUES (?, ?, ?, NULL)
      `;

      db.query(sql, [item.order_item_id || item.item_id, initialStatus, 'Order created'], (err, result) => {
        completed++;

        if (err) {
          errors.push(`Item ${index + 1}: ${err.message}`);
        }

        // When all items are processed, callback with results
        if (completed === orderItems.length) {
          if (errors.length > 0) {
            console.warn('Some tracking items failed to initialize:', errors);
          }
          callback(errors.length > 0 ? new Error(errors.join('; ')) : null,
            { success: true, errors: errors });
        }
      });
    });
  },

  // Get initial status based on service type
  getInitialStatus: (serviceType) => {
    switch (serviceType) {
      case 'repair':
      case 'customize':
      case 'dry_cleaning':
        return 'pending';
      case 'rental':
        return 'pending';
      default:
        return 'pending';
    }
  },

  // Get available status transitions for an order item
  getStatusTransitions: (serviceType, currentStatus) => {
    const flows = {
      'repair': {
        'pending': ['price_confirmation'],
        'price_confirmation': ['confirmed', 'price_declined'],
        'confirmed': ['ready_to_pickup'],
        'ready_to_pickup': ['completed'],
        'completed': [],
        'cancelled': [],
        'price_declined': []
      },
      'customize': {
        'pending': ['price_confirmation'],
        'price_confirmation': ['confirmed', 'price_declined'],
        'confirmed': ['ready_to_pickup'],
        'ready_to_pickup': ['completed'],
        'completed': [],
        'cancelled': [],
        'price_declined': []
      },
      'dry_cleaning': {
        'pending': ['price_confirmation'],
        'price_confirmation': ['confirmed', 'price_declined'],
        'confirmed': ['ready_to_pickup'],
        'ready_to_pickup': ['completed'],
        'completed': [],
        'cancelled': [],
        'price_declined': []
      },
      'rental': {
        'pending': ['rented', 'cancelled'],
        'ready_to_pickup': ['rented', 'returned', 'completed', 'cancelled'],
        'picked_up': ['rented'],
        'rented': ['returned', 'completed'],
        'returned': ['completed'],
        'completed': [],
        'cancelled': []
      }
    };

    return flows[serviceType]?.[currentStatus] || [];
  },

  // Get status display information
  // Get available next statuses based on current status and service type
  getNextStatuses: (serviceType, currentStatus) => {
    const statusFlow = {
      'repair': {
        'pending': ['in_progress', 'cancelled'],
        'price_confirmation': ['in_progress', 'cancelled'],
        'in_progress': ['ready_to_pickup', 'cancelled'],
        'ready_to_pickup': ['picked_up', 'cancelled'],
        'picked_up': ['completed'],
        'completed': [],
        'cancelled': [],
        'price_declined': []
      },
      'dry_cleaning': {
        'pending': ['in_progress', 'cancelled'],
        'price_confirmation': ['in_progress', 'cancelled'],
        'in_progress': ['ready_to_pickup', 'cancelled'],
        'ready_to_pickup': ['picked_up', 'cancelled'],
        'picked_up': ['completed'],
        'completed': [],
        'cancelled': [],
        'price_declined': []
      },
      'rental': {
        'pending': ['rented', 'cancelled'],
        'ready_to_pickup': ['rented', 'returned', 'completed', 'cancelled'],
        'picked_up': ['rented'],
        'rented': ['returned', 'completed'],
        'returned': ['completed'],
        'completed': [],
        'cancelled': []
      }
    };

    const flow = statusFlow[serviceType] || statusFlow['repair'];
    return flow[currentStatus] || [];
  },

  getStatusInfo: (status, serviceType) => {
    const statusMap = {
      'pending': { label: 'Pending', class: 'pending' },
      'price_confirmation': { label: 'Price Confirmation', class: 'price-confirmation' },
      'in_progress': { label: 'In Progress', class: 'in-progress' },
      'ready_to_pickup': { label: 'Ready to Pickup', class: 'ready' },
      'picked_up': { label: 'Picked Up', class: 'picked-up' },
      'rented': { label: 'Rented', class: 'rented' },
      'returned': { label: 'Returned', class: 'returned' },
      'completed': { label: 'Completed', class: 'completed' },
      'cancelled': { label: 'Cancelled', class: 'cancelled' },
      'price_declined': { label: 'Price Declined', class: 'cancelled' }
    };

    return statusMap[status] || { label: status, class: 'unknown' };
  }
};

module.exports = OrderTracking;
