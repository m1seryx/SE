const GarmentType = require('../model/GarmentTypeModel');
const db = require('../config/db');

// Function to ensure garment_types table exists
const ensureTableExists = (callback) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS garment_types (
      garment_id INT AUTO_INCREMENT PRIMARY KEY,
      garment_name VARCHAR(100) NOT NULL UNIQUE,
      garment_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_garment_name (garment_name),
      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating garment_types table:', err);
      return callback(err);
    }
    callback(null);
  });
};

// Get all active garment types (public endpoint)
exports.getAllGarmentTypes = (req, res) => {
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    GarmentType.getAll((err, garments) => {
      if (err) {
        console.error('Get garment types error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching garment types',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        garments: garments || []
      });
    });
  });
};

// Get all garment types including inactive (admin only)
exports.getAllGarmentTypesAdmin = (req, res) => {
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    GarmentType.getAllAdmin((err, garments) => {
      if (err) {
        console.error('Get garment types (admin) error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching garment types',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        garments: garments || []
      });
    });
  });
};

// Get garment type by ID
exports.getGarmentTypeById = (req, res) => {
  const garmentId = req.params.garmentId;
  
  GarmentType.getById(garmentId, (err, garment) => {
    if (err) {
      console.error('Get garment type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching garment type',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (!garment || garment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Garment type not found'
      });
    }
    
    res.json({
      success: true,
      garment: garment[0]
    });
  });
};

// Create new garment type (admin only)
exports.createGarmentType = (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  
  const { garment_name, garment_price, description, is_active } = req.body;
  
  if (!garment_name || !garment_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Garment name is required'
    });
  }
  
  if (garment_price === undefined || garment_price === null || isNaN(parseFloat(garment_price))) {
    return res.status(400).json({
      success: false,
      message: 'Valid garment price is required'
    });
  }
  
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    const garmentData = {
      garment_name: garment_name.trim(),
      garment_price: parseFloat(garment_price),
      description: description || null,
      is_active: is_active !== undefined ? is_active : 1
    };
    
    GarmentType.create(garmentData, (err, result) => {
      if (err) {
        console.error('Create garment type error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            success: false,
            message: 'Garment type with this name already exists'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error creating garment type',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        message: 'Garment type created successfully',
        garment: {
          garment_id: result.insertId,
          ...garmentData
        }
      });
    });
  });
};

// Update garment type (admin only)
exports.updateGarmentType = (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  
  const garmentId = req.params.garmentId;
  const { garment_name, garment_price, description, is_active } = req.body;
  
  if (!garment_name || !garment_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Garment name is required'
    });
  }
  
  if (garment_price === undefined || garment_price === null || isNaN(parseFloat(garment_price))) {
    return res.status(400).json({
      success: false,
      message: 'Valid garment price is required'
    });
  }
  
  const garmentData = {
    garment_name: garment_name.trim(),
    garment_price: parseFloat(garment_price),
    description: description || null,
    is_active: is_active !== undefined ? is_active : 1
  };
  
  GarmentType.update(garmentId, garmentData, (err, result) => {
    if (err) {
      console.error('Update garment type error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Garment type with this name already exists'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error updating garment type',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Garment type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Garment type updated successfully'
    });
  });
};

// Delete garment type (admin only)
exports.deleteGarmentType = (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  
  const garmentId = req.params.garmentId;
  const permanent = req.query.permanent === 'true';
  
  if (permanent) {
    GarmentType.permanentDelete(garmentId, (err, result) => {
      if (err) {
        console.error('Delete garment type error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting garment type',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Garment type not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Garment type permanently deleted'
      });
    });
  } else {
    GarmentType.delete(garmentId, (err, result) => {
      if (err) {
        console.error('Delete garment type error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting garment type',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Garment type not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Garment type deleted (deactivated)'
      });
    });
  }
};

