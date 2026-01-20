const db = require('../config/db');

const WalkInCustomer = {
  // Create a new walk-in customer
  create: (customerData, callback) => {
    const sql = `
      INSERT INTO walk_in_customers (name, email, phone)
      VALUES (?, ?, ?)
    `;
    const values = [
      customerData.name,
      customerData.email || null,
      customerData.phone
    ];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, { id: result.insertId, ...customerData });
    });
  },

  // Find or create walk-in customer (check by phone first)
  findOrCreate: (customerData, callback) => {
    // First, try to find by phone
    const findSql = `SELECT * FROM walk_in_customers WHERE phone = ? LIMIT 1`;
    db.query(findSql, [customerData.phone], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      
      if (results && results.length > 0) {
        // Customer exists, update email if provided and different
        const existing = results[0];
        if (customerData.email && customerData.email !== existing.email) {
          const updateSql = `UPDATE walk_in_customers SET email = ?, name = ? WHERE id = ?`;
          db.query(updateSql, [customerData.email, customerData.name, existing.id], (updateErr) => {
            if (updateErr) {
              console.error('Error updating walk-in customer:', updateErr);
            }
            callback(null, { ...existing, email: customerData.email, name: customerData.name });
          });
        } else {
          callback(null, existing);
        }
      } else {
        // Customer doesn't exist, create new
        WalkInCustomer.create(customerData, callback);
      }
    });
  },

  // Get walk-in customer by ID
  getById: (id, callback) => {
    const sql = `SELECT * FROM walk_in_customers WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0] || null);
    });
  },

  // Get all walk-in customers
  getAll: (callback) => {
    const sql = `
      SELECT 
        wc.*,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.total_price) as total_spent
      FROM walk_in_customers wc
      LEFT JOIN orders o ON o.walk_in_customer_id = wc.id
      GROUP BY wc.id
      ORDER BY wc.created_at DESC
    `;
    db.query(sql, callback);
  },

  // Get customer orders
  getCustomerOrders: (customerId, callback) => {
    const sql = `
      SELECT 
        o.*,
        COUNT(oi.item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.walk_in_customer_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `;
    db.query(sql, [customerId], callback);
  },

  // Search customers by name, phone, or email
  search: (searchTerm, callback) => {
    const sql = `
      SELECT * FROM walk_in_customers
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(sql, [searchPattern, searchPattern, searchPattern], callback);
  }
};

module.exports = WalkInCustomer;

