const db = require('../config/db');

const CustomerMeasurements = {
  // Get measurements for a customer
  getByCustomerId: (userId, callback) => {
    const sql = `
      SELECT * FROM customer_measurements 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    db.query(sql, [userId], callback);
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

  // Create or update measurements
  upsert: (userId, measurements, callback) => {
    // First check if measurements exist
    CustomerMeasurements.getByCustomerId(userId, (err, existing) => {
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
          WHERE user_id = ?
        `;
        db.query(sql, [topMeasurements, bottomMeasurements, notes, userId], callback);
      } else {
        // Create new
        const sql = `
          INSERT INTO customer_measurements (user_id, top_measurements, bottom_measurements, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `;
        db.query(sql, [userId, topMeasurements, bottomMeasurements, notes], callback);
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

