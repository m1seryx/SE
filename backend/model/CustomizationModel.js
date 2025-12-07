const db = require('../config/db');

const Customization = {
  // Get all customization orders (for admin)
  getAllOrders: (callback) => {
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
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN user u ON o.user_id = u.user_id
      WHERE oi.service_type = 'customization'
      ORDER BY o.order_date DESC
    `;
    
    db.query(sql, (err, results) => {
      if (err) return callback(err, null);
      
      // Parse JSON fields
      const orders = results.map(order => ({
        ...order,
        pricing_factors: JSON.parse(order.pricing_factors || '{}'),
        specific_data: JSON.parse(order.specific_data || '{}')
      }));
      
      callback(null, orders);
    });
  },

  // Get customization orders by user ID
  getByUserId: (userId, callback) => {
    const sql = `
      SELECT 
        oi.*,
        o.order_id,
        o.user_id,
        o.status as order_status,
        o.notes as order_notes,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as order_date,
        DATE_FORMAT(oi.appointment_date, '%Y-%m-%d %H:%i:%s') as appointment_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.user_id = ? AND oi.service_type = 'customization'
      ORDER BY o.order_date DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
      if (err) return callback(err, null);
      
      // Parse JSON fields
      const orders = results.map(order => ({
        ...order,
        pricing_factors: JSON.parse(order.pricing_factors || '{}'),
        specific_data: JSON.parse(order.specific_data || '{}')
      }));
      
      callback(null, orders);
    });
  },

  // Get single order item by ID
  getOrderItemById: (itemId, callback) => {
    const sql = `
      SELECT 
        oi.*,
        o.user_id,
        o.order_date,
        o.status as order_status,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN user u ON o.user_id = u.user_id
      WHERE oi.item_id = ? AND oi.service_type = 'customization'
    `;
    
    db.query(sql, [itemId], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null);
      
      const order = {
        ...results[0],
        pricing_factors: JSON.parse(results[0].pricing_factors || '{}'),
        specific_data: JSON.parse(results[0].specific_data || '{}')
      };
      
      callback(null, order);
    });
  },

  // Update order item (for admin - price, status, notes)
  updateOrderItem: (itemId, updateData, callback) => {
    const { finalPrice, approvalStatus, adminNotes, pricingFactors } = updateData;
    
    // First get current pricing_factors to merge with admin notes
    Customization.getOrderItemById(itemId, (err, currentItem) => {
      if (err) return callback(err, null);
      if (!currentItem) return callback(new Error('Order item not found'), null);
      
      // Merge pricing factors with admin notes
      const currentPricingFactors = currentItem.pricing_factors || {};
      if (adminNotes !== undefined) {
        currentPricingFactors.adminNotes = adminNotes;
      }
      if (pricingFactors) {
        Object.assign(currentPricingFactors, pricingFactors);
      }
      
      const updates = [];
      const values = [];
      
      if (finalPrice !== undefined) {
        updates.push('final_price = ?');
        values.push(finalPrice);
      }
      
      if (approvalStatus !== undefined) {
        updates.push('approval_status = ?');
        values.push(approvalStatus);
      }
      
      updates.push('pricing_factors = ?');
      values.push(JSON.stringify(currentPricingFactors));
      
      values.push(itemId);
      
      const sql = `UPDATE order_items SET ${updates.join(', ')} WHERE item_id = ?`;
      
      db.query(sql, values, callback);
    });
  },

  // Update approval status only
  updateApprovalStatus: (itemId, status, callback) => {
    const sql = `UPDATE order_items SET approval_status = ? WHERE item_id = ?`;
    db.query(sql, [status, itemId], callback);
  },

  // Get order statistics for admin dashboard
  getStats: (callback) => {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN approval_status IS NULL OR approval_status = 'pending' OR approval_status = 'pending_review' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN approval_status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN approval_status = 'confirmed' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN approval_status = 'ready_for_pickup' THEN 1 ELSE 0 END) as toPickup,
        SUM(CASE WHEN approval_status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN approval_status = 'cancelled' THEN 1 ELSE 0 END) as rejected
      FROM order_items
      WHERE service_type = 'customization'
    `;
    
    db.query(sql, callback);
  }
};

module.exports = Customization;
