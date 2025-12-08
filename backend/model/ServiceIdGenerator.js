const db = require('../config/db');

const ServiceIdGenerator = {
  // Get next service ID for a given service type
  getNextServiceId: (serviceType, callback) => {
    // Get the maximum service_id for this service type from cart
    const sql = `
      SELECT COALESCE(MAX(CAST(service_id AS UNSIGNED)), 0) as max_id
      FROM cart
      WHERE service_type = ?
    `;
    
    db.query(sql, [serviceType], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      
      // Increment by 1
      const nextId = (results[0]?.max_id || 0) + 1;
      callback(null, nextId);
    });
  },

  // Get next service ID for a given service type from orders (for more accurate tracking)
  getNextServiceIdFromOrders: (serviceType, callback) => {
    // Get the maximum service_id for this service type from order_items
    const sql = `
      SELECT COALESCE(MAX(CAST(service_id AS UNSIGNED)), 0) as max_id
      FROM order_items
      WHERE service_type = ?
    `;
    
    db.query(sql, [serviceType], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      
      // Also check cart for any higher IDs
      const cartSql = `
        SELECT COALESCE(MAX(CAST(service_id AS UNSIGNED)), 0) as max_id
        FROM cart
        WHERE service_type = ?
      `;
      
      db.query(cartSql, [serviceType], (cartErr, cartResults) => {
        if (cartErr) {
          return callback(cartErr, null);
        }
        
        const orderMaxId = results[0]?.max_id || 0;
        const cartMaxId = cartResults[0]?.max_id || 0;
        const nextId = Math.max(orderMaxId, cartMaxId) + 1;
        callback(null, nextId);
      });
    });
  }
};

module.exports = ServiceIdGenerator;

