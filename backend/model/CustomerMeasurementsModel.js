const db = require('../config/db');

const CustomerMeasurements = {
  // Get measurements for a customer (supports both online users and walk-in customers)
  getByCustomerId: (customerId, callback) => {
    // Try to get by user_id first, then by walk_in_customer_id
    const sql = `
      SELECT * FROM customer_measurements 
      WHERE user_id = ? OR walk_in_customer_id = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    db.query(sql, [customerId, customerId], callback);
  },
  
  // Get measurements by walk-in customer ID
  getByWalkInCustomerId: (walkInCustomerId, callback) => {
    const sql = `
      SELECT * FROM customer_measurements 
      WHERE walk_in_customer_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    db.query(sql, [walkInCustomerId], callback);
  },

  // Get all measurements history for a customer
  getAllByCustomerId: (userId, callback) => {
    const sql = `
      SELECT * FROM customer_measurements 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Create or update measurements (supports both online users and walk-in customers)
  upsert: (customerId, measurements, callback) => {
    const { isWalkIn = false } = measurements;
    
    // First check if measurements exist
    CustomerMeasurements.getByCustomerId(customerId, (err, existing) => {
      if (err) {
        return callback(err, null);
      }

      const topMeasurements = JSON.stringify(measurements.top || {});
      const bottomMeasurements = JSON.stringify(measurements.bottom || {});
      const notes = measurements.notes || '';

      if (existing && existing.length > 0) {
        // Update existing
        const sql = `
          UPDATE customer_measurements 
          SET top_measurements = ?, bottom_measurements = ?, notes = ?, updated_at = NOW()
          WHERE (user_id = ? OR walk_in_customer_id = ?)
        `;
        db.query(sql, [topMeasurements, bottomMeasurements, notes, customerId, customerId], callback);
      } else {
        // Create new
        if (isWalkIn) {
          const sql = `
            INSERT INTO customer_measurements (user_id, walk_in_customer_id, top_measurements, bottom_measurements, notes, created_at, updated_at)
            VALUES (NULL, ?, ?, ?, ?, NOW(), NOW())
          `;
          db.query(sql, [customerId, topMeasurements, bottomMeasurements, notes], callback);
        } else {
          const sql = `
            INSERT INTO customer_measurements (user_id, walk_in_customer_id, top_measurements, bottom_measurements, notes, created_at, updated_at)
            VALUES (?, NULL, ?, ?, ?, NOW(), NOW())
          `;
          db.query(sql, [customerId, topMeasurements, bottomMeasurements, notes], callback);
        }
      }
    });
  },

  // Delete measurements
  delete: (measurementId, callback) => {
    const sql = `DELETE FROM customer_measurements WHERE measurement_id = ?`;
    db.query(sql, [measurementId], callback);
  }
};

module.exports = CustomerMeasurements;

