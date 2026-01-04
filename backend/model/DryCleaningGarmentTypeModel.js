const db = require('../config/db');

const DryCleaningGarmentType = {
  // Get all active dry cleaning garment types
  getAllActive: (callback) => {
    const sql = `SELECT * FROM dry_cleaning_garment_types WHERE is_active = 1 ORDER BY garment_name ASC`;
    db.query(sql, callback);
  },

  // Get all dry cleaning garment types (including inactive) for admin
  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM dry_cleaning_garment_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  // Get single dry cleaning garment type by ID
  getById: (id, callback) => {
    const sql = `SELECT * FROM dry_cleaning_garment_types WHERE dc_garment_id = ?`;
    db.query(sql, [id], callback);
  },

  // Create new dry cleaning garment type
  create: (data, callback) => {
    const sql = `
      INSERT INTO dry_cleaning_garment_types (garment_name, garment_price, description, is_active)
      VALUES (?, ?, ?, ?)
    `;
    const values = [data.garment_name, data.garment_price || 0, data.description || null, data.is_active !== undefined ? data.is_active : 1];
    db.query(sql, values, callback);
  },

  // Update dry cleaning garment type
  update: (id, data, callback) => {
    const sql = `
      UPDATE dry_cleaning_garment_types 
      SET garment_name = ?, garment_price = ?, description = ?, is_active = ?
      WHERE dc_garment_id = ?
    `;
    const values = [data.garment_name, data.garment_price || 0, data.description || null, data.is_active !== undefined ? data.is_active : 1, id];
    db.query(sql, values, callback);
  },

  // Soft delete (set inactive)
  softDelete: (id, callback) => {
    const sql = `UPDATE dry_cleaning_garment_types SET is_active = 0 WHERE dc_garment_id = ?`;
    db.query(sql, [id], callback);
  },

  // Hard delete
  hardDelete: (id, callback) => {
    const sql = `DELETE FROM dry_cleaning_garment_types WHERE dc_garment_id = ?`;
    db.query(sql, [id], callback);
  }
};

module.exports = DryCleaningGarmentType;
