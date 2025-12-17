const db = require('../config/db');

const RepairGarmentType = {
  // Get all repair garment types
  getAll: (callback) => {
    const sql = `SELECT * FROM repair_garment_types WHERE is_active = 1 ORDER BY garment_name ASC`;
    db.query(sql, callback);
  },

  // Get all repair garment types (including inactive) - for admin
  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM repair_garment_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  // Get repair garment type by ID
  getById: (garmentId, callback) => {
    const sql = `SELECT * FROM repair_garment_types WHERE repair_garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  // Create new repair garment type
  create: (garmentData, callback) => {
    const { garment_name, description, is_active } = garmentData;
    const sql = `
      INSERT INTO repair_garment_types (garment_name, description, is_active)
      VALUES (?, ?, ?)
    `;
    db.query(sql, [garment_name, description || null, is_active !== undefined ? is_active : 1], callback);
  },

  // Update repair garment type
  update: (garmentId, garmentData, callback) => {
    const { garment_name, description, is_active } = garmentData;
    const sql = `
      UPDATE repair_garment_types 
      SET garment_name = ?, description = ?, is_active = ?
      WHERE repair_garment_id = ?
    `;
    db.query(sql, [garment_name, description || null, is_active !== undefined ? is_active : 1, garmentId], callback);
  },

  // Delete repair garment type (soft delete by setting is_active = 0)
  delete: (garmentId, callback) => {
    const sql = `UPDATE repair_garment_types SET is_active = 0 WHERE repair_garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  // Permanently delete repair garment type
  permanentDelete: (garmentId, callback) => {
    const sql = `DELETE FROM repair_garment_types WHERE repair_garment_id = ?`;
    db.query(sql, [garmentId], callback);
  }
};

module.exports = RepairGarmentType;

