const db = require('../config/db');

const CustomizationService = {
  // Get all customization services
  getAll: (callback) => {
    const sql = "SELECT * FROM customization_services ORDER BY service_name";
    db.query(sql, callback);
  },

  // Get customization service by ID
  getById: (serviceId, callback) => {
    const sql = "SELECT * FROM customization_services WHERE service_id = ?";
    db.query(sql, [serviceId], callback);
  },

  // Create new customization service
  create: (serviceData, callback) => {
    const {
      service_name,
      description,
      base_price,
      style_complexity,
      clothing_type,
      variant_id,
      gender,
      fabric_type,
      pattern_type,
      color_value,
      clothing_fit,
      ai_image_url,
      customization_prompt,
      estimated_time,
      requires_image
    } = serviceData;

    const sql = `
      INSERT INTO customization_services 
      (service_name, description, base_price, style_complexity, clothing_type, variant_id, gender, fabric_type, pattern_type, color_value, clothing_fit, ai_image_url, customization_prompt, estimated_time, requires_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [
      service_name,
      description,
      base_price,
      style_complexity || 'basic',
      clothing_type || null,
      variant_id || null,
      gender || 'unisex',
      fabric_type || null,
      pattern_type || null,
      color_value || null,
      clothing_fit || 'regular',
      ai_image_url || null,
      customization_prompt || null,
      estimated_time,
      requires_image !== undefined ? requires_image : 1
    ], callback);
  },

  // Update customization service
  update: (serviceId, serviceData, callback) => {
    const {
      service_name,
      description,
      base_price,
      style_complexity,
      clothing_type,
      variant_id,
      gender,
      fabric_type,
      pattern_type,
      color_value,
      clothing_fit,
      ai_image_url,
      customization_prompt,
      estimated_time,
      requires_image
    } = serviceData;

    const sql = `
      UPDATE customization_services 
      SET service_name = ?, description = ?, base_price = ?, style_complexity = ?, 
          clothing_type = ?, variant_id = ?, gender = ?, fabric_type = ?, pattern_type = ?, 
          color_value = ?, clothing_fit = ?, ai_image_url = ?, customization_prompt = ?,
          estimated_time = ?, requires_image = ?
      WHERE service_id = ?
    `;
    
    db.query(sql, [
      service_name,
      description,
      base_price,
      style_complexity || 'basic',
      clothing_type || null,
      variant_id || null,
      gender || 'unisex',
      fabric_type || null,
      pattern_type || null,
      color_value || null,
      clothing_fit || 'regular',
      ai_image_url || null,
      customization_prompt || null,
      estimated_time,
      requires_image !== undefined ? requires_image : 1,
      serviceId
    ], callback);
  },

  // Delete customization service
  delete: (serviceId, callback) => {
    const sql = "DELETE FROM customization_services WHERE service_id = ?";
    db.query(sql, [serviceId], callback);
  },

  // Search customization services by name
  search: (searchTerm, callback) => {
    const sql = `
      SELECT * FROM customization_services 
      WHERE service_name LIKE ? OR description LIKE ?
      ORDER BY service_name
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(sql, [searchPattern, searchPattern], callback);
  }
};

module.exports = CustomizationService;