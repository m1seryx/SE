const db = require('../config/db');

const ShopSchedule = {
  // Get all shop schedule
  getAll: (callback) => {
    const sql = `
      SELECT day_of_week, is_open 
      FROM shop_schedule 
      ORDER BY day_of_week
    `;
    
    db.query(sql, callback);
  },

  // Get schedule for a specific day
  getByDay: (dayOfWeek, callback) => {
    const sql = `
      SELECT day_of_week, is_open 
      FROM shop_schedule 
      WHERE day_of_week = ?
    `;
    
    db.query(sql, [dayOfWeek], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0] || null);
    });
  },

  // Check if a date is on an open day
  isDateOpen: (dateString, callback) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    ShopSchedule.getByDay(dayOfWeek, (err, schedule) => {
      if (err) {
        console.error('[SHOP SCHEDULE] Error checking date:', dateString, 'Day:', dayOfWeek, 'Error:', err);
        // Fallback to default (Monday-Saturday) if error
        return callback(null, dayOfWeek >= 1 && dayOfWeek <= 6);
      }
      
      if (!schedule) {
        console.warn('[SHOP SCHEDULE] No schedule found for day:', dayOfWeek, 'Defaulting to closed');
        // If no schedule found, default to closed
        return callback(null, false);
      }
      
      const isOpen = schedule.is_open === 1;
      console.log('[SHOP SCHEDULE] Date:', dateString, 'Day:', dayOfWeek, 'Is Open:', isOpen);
      callback(null, isOpen);
    });
  },

  // Update shop schedule for a day
  update: (dayOfWeek, isOpen, callback) => {
    const sql = `
      INSERT INTO shop_schedule (day_of_week, is_open) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE is_open = ?, updated_at = CURRENT_TIMESTAMP
    `;
    
    db.query(sql, [dayOfWeek, isOpen, isOpen], callback);
  },

  // Update multiple days at once
  updateMultiple: (scheduleData, callback) => {
    if (!scheduleData || scheduleData.length === 0) {
      return callback(new Error('Schedule data is required'), null);
    }

    // Update each day individually to ensure proper handling
    let completed = 0;
    let hasError = null;
    const total = scheduleData.length;
    
    if (total === 0) {
      return callback(null, { affectedRows: 0 });
    }
    
    scheduleData.forEach((item) => {
      const updateSql = `
        INSERT INTO shop_schedule (day_of_week, is_open) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE is_open = ?, updated_at = CURRENT_TIMESTAMP
      `;
      
      db.query(updateSql, [item.day_of_week, item.is_open ? 1 : 0, item.is_open ? 1 : 0], (err) => {
        if (err && !hasError) {
          hasError = err;
          return callback(err, null);
        }
        
        completed++;
        if (completed === total && !hasError) {
          callback(null, { affectedRows: completed });
        }
      });
    });
  },

  // Ensure table exists
  ensureTableExists: (callback) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS shop_schedule (
        schedule_id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week TINYINT NOT NULL UNIQUE COMMENT '0 = Sunday, 1 = Monday, ..., 6 = Saturday',
        is_open TINYINT(1) DEFAULT 1 COMMENT '1 = Open, 0 = Closed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_day_of_week (day_of_week),
        INDEX idx_is_open (is_open)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    db.query(createTableSQL, (err) => {
      if (err) {
        console.error('[SHOP SCHEDULE] Error creating shop_schedule table:', err);
        return callback(err);
      }

      // Insert default schedule if table is empty
      const checkDataSQL = `SELECT COUNT(*) as count FROM shop_schedule`;
      db.query(checkDataSQL, (err, results) => {
        if (err) {
          console.error('[SHOP SCHEDULE] Error checking shop_schedule data:', err);
          return callback(err);
        }

        if (results[0].count === 0) {
          const insertDefaultSQL = `
            INSERT INTO shop_schedule (day_of_week, is_open) VALUES
            (0, 0), (1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1)
          `;
          
          db.query(insertDefaultSQL, (err) => {
            if (err) {
              console.error('[SHOP SCHEDULE] Error inserting default schedule:', err);
              return callback(err);
            }
            console.log('[SHOP SCHEDULE] ✅ Default schedule initialized');
            callback(null);
          });
        } else {
          console.log('[SHOP SCHEDULE] ✅ Table ready');
          callback(null);
        }
      });
    });
  }
};

module.exports = ShopSchedule;

