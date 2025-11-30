const db = require('../config/db');

const RentalInventory = {
  // Create new rental item
  create: (itemData, callback) => {
    const sql = `
      INSERT INTO rental_inventory 
      (item_name, description, brand, size, color, category, base_rental_fee, daily_rate, deposit_amount, total_available, image_url, material, care_instructions) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      itemData.item_name,
      itemData.description || null,
      itemData.brand || null,
      itemData.size || null,
      itemData.color || null,
      itemData.category || null,
      itemData.base_rental_fee,
      itemData.daily_rate,
      itemData.deposit_amount || '0',
      itemData.total_available || 1,
      itemData.image_url || null,
      itemData.material || null,
      itemData.care_instructions || null
    ];
    db.query(sql, values, callback);
  },

  // Get all rental items (for admin)
  getAll: (callback) => {
    const sql = "SELECT * FROM rental_inventory ORDER BY created_at DESC";
    db.query(sql, callback);
  },

  // Get available rental items with pagination and filters (for users)
  getAvailableItems: (filters = {}, callback) => {
    let sql = "SELECT * FROM rental_inventory WHERE status = 'available' AND total_available > 0";
    const values = [];
    
    if (filters.category) {
      sql += " AND category = ?";
      values.push(filters.category);
    }
    
    if (filters.min_price) {
      sql += " AND daily_rate >= ?";
      values.push(filters.min_price);
    }
    
    if (filters.max_price) {
      sql += " AND daily_rate <= ?";
      values.push(filters.max_price);
    }
    
    if (filters.search) {
      sql += " AND (item_name LIKE ? OR description LIKE ? OR brand LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += " ORDER BY created_at DESC";
    
    // Add pagination
    if (filters.limit) {
      sql += " LIMIT ?";
      values.push(filters.limit);
    }
    
    if (filters.offset) {
      sql += " OFFSET ?";
      values.push(filters.offset);
    }
    
    db.query(sql, values, callback);
  },

  // Get count of available items for pagination
  getAvailableItemsCount: (filters = {}, callback) => {
    let sql = "SELECT COUNT(*) as total FROM rental_inventory WHERE status = 'available' AND total_available > 0";
    const values = [];
    
    if (filters.category) {
      sql += " AND category = ?";
      values.push(filters.category);
    }
    
    if (filters.min_price) {
      sql += " AND daily_rate >= ?";
      values.push(filters.min_price);
    }
    
    if (filters.max_price) {
      sql += " AND daily_rate <= ?";
      values.push(filters.max_price);
    }
    
    if (filters.search) {
      sql += " AND (item_name LIKE ? OR description LIKE ? OR brand LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }
    
    db.query(sql, values, callback);
  },

  // Get rental item by ID
  findById: (item_id, callback) => {
    const sql = "SELECT * FROM rental_inventory WHERE item_id = ?";
    db.query(sql, [item_id], callback);
  },

  // Search rental items with pagination (for users)
  searchItems: (filters = {}, callback) => {
    let sql = "SELECT * FROM rental_inventory WHERE status = 'available' AND total_available > 0";
    const values = [];
    
    if (filters.query) {
      sql += " AND (item_name LIKE ? OR description LIKE ? OR brand LIKE ? OR category LIKE ?)";
      const searchTerm = `%${filters.query}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (filters.category) {
      sql += " AND category = ?";
      values.push(filters.category);
    }
    
    if (filters.min_price) {
      sql += " AND daily_rate >= ?";
      values.push(filters.min_price);
    }
    
    if (filters.max_price) {
      sql += " AND daily_rate <= ?";
      values.push(filters.max_price);
    }
    
    sql += " ORDER BY created_at DESC";
    
    // Add pagination
    if (filters.limit) {
      sql += " LIMIT ?";
      values.push(filters.limit);
    }
    
    if (filters.offset) {
      sql += " OFFSET ?";
      values.push(filters.offset);
    }
    
    db.query(sql, values, callback);
  },

  // Get search count
  getSearchCount: (filters = {}, callback) => {
    let sql = "SELECT COUNT(*) as total FROM rental_inventory WHERE status = 'available' AND total_available > 0";
    const values = [];
    
    if (filters.query) {
      sql += " AND (item_name LIKE ? OR description LIKE ? OR brand LIKE ? OR category LIKE ?)";
      const searchTerm = `%${filters.query}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (filters.category) {
      sql += " AND category = ?";
      values.push(filters.category);
    }
    
    if (filters.min_price) {
      sql += " AND daily_rate >= ?";
      values.push(filters.min_price);
    }
    
    if (filters.max_price) {
      sql += " AND daily_rate <= ?";
      values.push(filters.max_price);
    }
    
    db.query(sql, values, callback);
  },

  // Get items by category with pagination
  getByCategoryPaginated: (category, limit, offset, callback) => {
    const sql = `
      SELECT * FROM rental_inventory 
      WHERE category = ? AND status = 'available' AND total_available > 0 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    db.query(sql, [category, limit, offset], callback);
  },

  // Get category count
  getCategoryCount: (category, callback) => {
    const sql = "SELECT COUNT(*) as total FROM rental_inventory WHERE category = ? AND status = 'available' AND total_available > 0";
    db.query(sql, [category], callback);
  },

  // Get featured items (newest available items)
  getFeaturedItems: (limit, callback) => {
    const sql = `
      SELECT * FROM rental_inventory 
      WHERE status = 'available' AND total_available > 0 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    db.query(sql, [limit], callback);
  },

  // Get similar items from same category
  getSimilarItems: (category, excludeId, limit, callback) => {
    const sql = `
      SELECT * FROM rental_inventory 
      WHERE category = ? AND item_id != ? AND status = 'available' AND total_available > 0 
      ORDER BY RAND() 
      LIMIT ?
    `;
    db.query(sql, [category, excludeId, limit], callback);
  },

  // Get items by category
  getByCategory: (category, callback) => {
    const sql = "SELECT * FROM rental_inventory WHERE category = ? AND status = 'available' ORDER BY created_at DESC";
    db.query(sql, [category], callback);
  },

  // Update rental item
  update: (item_id, itemData, callback) => {
    const sql = `
      UPDATE rental_inventory 
      SET item_name = ?, description = ?, brand = ?, size = ?, color = ?, category = ?, 
          base_rental_fee = ?, daily_rate = ?, deposit_amount = ?, total_available = ?, 
          image_url = ?, material = ?, care_instructions = ?, status = ?
      WHERE item_id = ?
    `;
    const values = [
      itemData.item_name,
      itemData.description || null,
      itemData.brand || null,
      itemData.size || null,
      itemData.color || null,
      itemData.category || null,
      itemData.base_rental_fee,
      itemData.daily_rate,
      itemData.deposit_amount || '0',
      itemData.total_available,
      itemData.image_url || null,
      itemData.material || null,
      itemData.care_instructions || null,
      itemData.status || 'available',
      item_id
    ];
    db.query(sql, values, callback);
  },

 
  updateStatus: (item_id, status, callback) => {
    const sql = "UPDATE rental_inventory SET status = ? WHERE item_id = ?";
    db.query(sql, [status, item_id], callback);
  },


  updateRentedCount: (item_id, change, callback) => {
    const sql = "UPDATE rental_inventory SET currently_rented = currently_rented + ? WHERE item_id = ?";
    db.query(sql, [change, item_id], callback);
  },


  delete: (item_id, callback) => {
    const sql = "DELETE FROM rental_inventory WHERE item_id = ?";
    db.query(sql, [item_id], callback);
  },


  search: (searchTerm, callback) => {
    const sql = `
      SELECT * FROM rental_inventory 
      WHERE (item_name LIKE ? OR description LIKE ? OR brand LIKE ? OR category LIKE ?) 
      AND status = 'available'
      ORDER BY created_at DESC
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern], callback);
  },


  getCategories: (callback) => {
    const sql = "SELECT DISTINCT category FROM rental_inventory WHERE category IS NOT NULL ORDER BY category";
    db.query(sql, callback);
  }
};

module.exports = RentalInventory;