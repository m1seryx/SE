const db = require('../config/db');

const GarmentType = {
  // Get all garment types
  getAll: (callback) => {
    const sql = `SELECT * FROM garment_types WHERE is_active = 1 ORDER BY garment_name ASC`;
    db.query(sql, callback);
  },

  // Get all garment types (including inactive) - for admin
  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM garment_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  // Get garment type by ID
  getById: (garmentId, callback) => {
    const sql = `SELECT * FROM garment_types WHERE garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  // Create new garment type
  create: (garmentData, callback) => {
    const { garment_name, garment_price, description, is_active } = garmentData;
    const sql = `
      INSERT INTO garment_types (garment_name, garment_price, description, is_active)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [garment_name, garment_price || 0.00, description || null, is_active !== undefined ? is_active : 1], callback);
  },

  // Update garment type
  update: (garmentId, garmentData, callback) => {
    const { garment_name, garment_price, description, is_active } = garmentData;
    const sql = `
      UPDATE garment_types 
      SET garment_name = ?, garment_price = ?, description = ?, is_active = ?
      WHERE garment_id = ?
    `;
    db.query(sql, [garment_name, garment_price, description || null, is_active !== undefined ? is_active : 1, garmentId], callback);
  },

  // Delete garment type (soft delete by setting is_active = 0)
  delete: (garmentId, callback) => {
    const sql = `UPDATE garment_types SET is_active = 0 WHERE garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  // Permanently delete garment type
  permanentDelete: (garmentId, callback) => {
    const sql = `DELETE FROM garment_types WHERE garment_id = ?`;
    db.query(sql, [garmentId], callback);
  }
};

module.exports = GarmentType;

