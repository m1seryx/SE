const db = require('../config/db');

const FabricType = {
  // Get all fabric types
  getAll: (callback) => {
    const sql = `SELECT * FROM fabric_types WHERE is_active = 1 ORDER BY fabric_name ASC`;
    db.query(sql, callback);
  },

  // Get all fabric types (including inactive) - for admin
  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM fabric_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  // Get fabric type by ID
  getById: (fabricId, callback) => {
    const sql = `SELECT * FROM fabric_types WHERE fabric_id = ?`;
    db.query(sql, [fabricId], callback);
  },

  // Create new fabric type
  create: (fabricData, callback) => {
    const { fabric_name, fabric_price, description, is_active } = fabricData;
    const sql = `
      INSERT INTO fabric_types (fabric_name, fabric_price, description, is_active)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [fabric_name, fabric_price || 0.00, description || null, is_active !== undefined ? is_active : 1], callback);
  },

  // Update fabric type
  update: (fabricId, fabricData, callback) => {
    const { fabric_name, fabric_price, description, is_active } = fabricData;
    const sql = `
      UPDATE fabric_types 
      SET fabric_name = ?, fabric_price = ?, description = ?, is_active = ?
      WHERE fabric_id = ?
    `;
    db.query(sql, [fabric_name, fabric_price, description || null, is_active !== undefined ? is_active : 1, fabricId], callback);
  },

  // Delete fabric type (soft delete by setting is_active = 0)
  delete: (fabricId, callback) => {
    const sql = `UPDATE fabric_types SET is_active = 0 WHERE fabric_id = ?`;
    db.query(sql, [fabricId], callback);
  },

  // Permanently delete fabric type
  permanentDelete: (fabricId, callback) => {
    const sql = `DELETE FROM fabric_types WHERE fabric_id = ?`;
    db.query(sql, [fabricId], callback);
  }
};

module.exports = FabricType;

