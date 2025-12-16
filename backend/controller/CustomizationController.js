const Customization = require('../model/CustomizationModel');
const Custom3DModel = require('../model/Custom3DModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Configure multer for customization image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/customization-images';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'customization-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: fileFilter
});

// Export multer upload for routes
exports.uploadCustomizationImage = upload.single('customizationImage');

// Upload customization image endpoint
exports.handleImageUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Return the file path that can be accessed via URL
    const imageUrl = `/uploads/customization-images/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
};

// Get all customization orders (admin)
exports.getAllCustomizationOrders = (req, res) => {
  Customization.getAllOrders((err, orders) => {
    if (err) {
      console.error('Get all customization orders error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customization orders'
      });
    }
    
    res.json({
      success: true,
      orders: orders
    });
  });
};

// Get user's customization orders
exports.getUserCustomizationOrders = (req, res) => {
  const userId = req.user.id;
  
  Customization.getByUserId(userId, (err, orders) => {
    if (err) {
      console.error('Get user customization orders error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customization orders'
      });
    }
    
    res.json({
      success: true,
      orders: orders
    });
  });
};

// Get single customization order item
exports.getCustomizationOrderById = (req, res) => {
  const { itemId } = req.params;
  
  Customization.getOrderItemById(itemId, (err, order) => {
    if (err) {
      console.error('Get customization order error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customization order'
      });
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Customization order not found'
      });
    }
    
    res.json({
      success: true,
      order: order
    });
  });
};

// Update customization order item (admin)
exports.updateCustomizationOrderItem = (req, res) => {
  const { itemId } = req.params;
  const updateData = req.body;
  const userId = req.user.id;
  
  // Get current status before updating
  const Order = require('../model/OrderModel');
  Order.getOrderItemById(itemId, (getErr, item) => {
    if (getErr || !item) {
      return res.status(500).json({
        success: false,
        message: "Error fetching order item",
        error: getErr
      });
    }

    const previousStatus = item.approval_status || 'pending';
    const previousPrice = item.final_price || null;
  
    Customization.updateOrderItem(itemId, updateData, (err, result) => {
      if (err) {
        console.error('Update customization order error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating customization order'
        });
      }
      
      // Log the action - ALWAYS log status updates
      const ActionLog = require('../model/ActionLogModel');
      // Get admin user_id - use userId from params if available, otherwise get from order
      const adminUserId = userId || item.user_id || null;
      
      if (!adminUserId) {
        console.error('Cannot log action: user_id is missing. userId:', userId, 'item.user_id:', item.user_id);
      }
      
      let actionNotes = [];
      
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        actionNotes.push(`Status: ${previousStatus} → ${updateData.approvalStatus}`);
      }
      if (updateData.finalPrice && updateData.finalPrice !== previousPrice) {
        actionNotes.push(`Price: ₱${previousPrice || 0} → ₱${updateData.finalPrice}`);
      }
      if (updateData.adminNotes) {
        actionNotes.push(`Admin notes: ${updateData.adminNotes}`);
      }

      // Always log, even if status didn't change (for tracking)
      const newStatus = updateData.approvalStatus || previousStatus;

      // Only log if we have a valid user_id
      if (adminUserId) {
        ActionLog.create({
          order_item_id: itemId,
          user_id: adminUserId,
          action_type: 'status_update',
          action_by: 'admin',
          previous_status: previousStatus,
          new_status: newStatus,
          reason: null,
          notes: actionNotes.length > 0 
            ? `Admin updated customization order: ${actionNotes.join(', ')}`
            : `Admin updated customization order (status: ${newStatus})`
        }, (logErr, logResult) => {
          if (logErr) {
            console.error('Error logging customization order action:', logErr);
            console.error('Log data:', {
              order_item_id: itemId,
              user_id: adminUserId,
              action_type: 'status_update',
              previous_status: previousStatus,
              new_status: newStatus
            });
          } else {
            console.log('Successfully logged customization order action:', logResult?.insertId);
          }
        });
      } else {
        console.error('Skipping action log: user_id is null or undefined');
      }

      // Auto-update billing payment_status
      const billingHelper = require('../utils/billingHelper');
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        billingHelper.updateBillingStatus(itemId, 'customization', updateData.approvalStatus, previousStatus, (billingErr, billingResult) => {
          if (billingErr) {
            console.error('Error auto-updating billing status:', billingErr);
          } else if (billingResult) {
            console.log('Billing status auto-updated:', billingResult);
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Customization order updated successfully'
      });
    });
  });
};

// Update approval status (admin quick action)
exports.updateApprovalStatus = (req, res) => {
  const { itemId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }
  
  // Get current status before updating
  const Order = require('../model/OrderModel');
  Order.getOrderItemById(itemId, (getErr, item) => {
    if (getErr || !item) {
      return res.status(500).json({
        success: false,
        message: "Error fetching order item",
        error: getErr
      });
    }

    const previousStatus = item.approval_status || 'pending';
  
    Customization.updateApprovalStatus(itemId, status, (err, result) => {
      if (err) {
        console.error('Update approval status error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating approval status'
        });
      }
      
      // Log the action - ALWAYS log status updates
      const ActionLog = require('../model/ActionLogModel');
      // Get admin user_id - use userId from params if available, otherwise get from order
      const adminUserId = userId || item.user_id || null;
      
      if (!adminUserId) {
        console.error('Cannot log action: user_id is missing. userId:', userId, 'item.user_id:', item.user_id);
      }

      // Only log if we have a valid user_id
      if (adminUserId) {
        ActionLog.create({
          order_item_id: itemId,
          user_id: adminUserId,
          action_type: 'status_update',
          action_by: 'admin',
          previous_status: previousStatus,
          new_status: status,
          reason: null,
          notes: `Admin updated customization approval status from ${previousStatus} to ${status}`
        }, (logErr, logResult) => {
          if (logErr) {
            console.error('Error logging customization approval status update:', logErr);
            console.error('Log data:', {
              order_item_id: itemId,
              user_id: adminUserId,
              action_type: 'status_update',
              previous_status: previousStatus,
              new_status: status
            });
          } else {
            console.log('Successfully logged customization approval status update:', logResult?.insertId);
          }
        });
      } else {
        console.error('Skipping action log: user_id is null or undefined');
      }

      // Auto-update billing payment_status
      const billingHelper = require('../utils/billingHelper');
      if (status !== previousStatus) {
        billingHelper.updateBillingStatus(itemId, 'customization', status, previousStatus, (billingErr, billingResult) => {
          if (billingErr) {
            console.error('Error auto-updating billing status:', billingErr);
          } else if (billingResult) {
            console.log('Billing status auto-updated:', billingResult);
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Approval status updated successfully'
      });
    });
  });
};

// Get customization stats (admin dashboard)
exports.getCustomizationStats = (req, res) => {
  Customization.getStats((err, results) => {
    if (err) {
      console.error('Get customization stats error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customization stats'
      });
    }
    
    const stats = results[0] || {
      total: 0,
      pending: 0,
      accepted: 0,
      inProgress: 0,
      toPickup: 0,
      completed: 0,
      rejected: 0
    };
    
    res.json({
      success: true,
      stats: stats
    });
  });
};

// Configure multer for GLB file uploads
const glbStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/custom-3d-models';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'custom-model-' + uniqueSuffix + ext);
  }
});

const glbFileFilter = (req, file, cb) => {
  // Accept GLB files only
  const allowedTypes = /glb|GLB/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'model/gltf-binary' || file.mimetype === 'application/octet-stream' || file.mimetype === '';
  
  if (extname || mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only GLB files are allowed!'), false);
  }
};

const uploadGLB = multer({
  storage: glbStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size for 3D models
  fileFilter: glbFileFilter
});

// Export multer upload for GLB files
exports.uploadGLBFile = uploadGLB.single('glbFile');

// Ensure custom_3d_models table exists
const ensureTableExists = (callback) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS custom_3d_models (
      model_id INT AUTO_INCREMENT PRIMARY KEY,
      model_name VARCHAR(255) NOT NULL,
      model_type ENUM('garment', 'button', 'accessory') DEFAULT 'garment',
      file_path VARCHAR(500) NOT NULL COMMENT 'Path to GLB file in uploads directory',
      file_url VARCHAR(500) NOT NULL COMMENT 'URL to access the GLB file',
      garment_category VARCHAR(100) COMMENT 'Category like coat-men, barong, suit, pants, etc.',
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_by INT COMMENT 'Admin user_id who uploaded the model',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_model_type (model_type),
      INDEX idx_garment_category (garment_category),
      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createTableSQL, (err, result) => {
    if (err) {
      console.error('Error creating custom_3d_models table:', err);
      return callback(err);
    }
    console.log('✓ custom_3d_models table ensured');
    callback(null);
  });
};

// Upload GLB file endpoint
exports.handleGLBUpload = (req, res) => {
  // First ensure table exists
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    // Continue with upload
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No GLB file uploaded'
        });
      }

      const { model_name, model_type, garment_category, description } = req.body;
    
    if (!model_name || !model_name.trim()) {
      // Delete uploaded file if validation fails
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Model name is required'
      });
    }

    const fileUrl = `/uploads/custom-3d-models/${req.file.filename}`;
    const filePath = req.file.path;
    
    // Helper function to save model to database (defined before use)
    const saveModelToDatabase = (userId) => {
      // Save to database
      Custom3DModel.create({
        model_name,
        model_type: model_type || 'garment',
        file_path: filePath,
        file_url: fileUrl,
        garment_category: garment_category || null,
        description: description || null,
        created_by: userId
      }, (err, result) => {
        if (err) {
          console.error('Error saving GLB model to database:', err);
          console.error('Error details:', {
            code: err.code,
            errno: err.errno,
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState
          });
          // Delete uploaded file if database save fails
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
              console.error('Error deleting file:', unlinkErr);
            }
          }
          return res.status(500).json({
            success: false,
            message: err.code === 'ER_NO_SUCH_TABLE' 
              ? 'Database table does not exist. Please run the migration script: backend/database/custom_3d_models.sql'
              : err.sqlMessage || err.message || 'Error saving model to database',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

        res.json({
          success: true,
          message: 'GLB file uploaded successfully',
          model: {
            model_id: result.insertId,
            model_name,
            model_type: model_type || 'garment',
            file_url: fileUrl,
            garment_category,
            description
          }
        });
      });
    };
    
    // Get user ID from token - handle both user and admin tokens
    let created_by = null;
    if (req.user) {
      created_by = req.user.id || req.user.user_id || req.user.admin_id;
    }
    
    // If admin token doesn't have ID but has username, get it from database
    if (!created_by && req.user && req.user.role === 'admin' && req.user.username) {
      const Admin = require('../model/AdminModel');
      return Admin.findByUsername(req.user.username, (err, adminResults) => {
        if (err || !adminResults || adminResults.length === 0) {
          console.error('Error fetching admin from database:', err);
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
              console.error('Error deleting file:', unlinkErr);
            }
          }
          return res.status(401).json({
            success: false,
            message: 'User authentication required. Please log out and log back in to refresh your session.'
          });
        }
        
        const adminId = adminResults[0].admin_id || adminResults[0].id;
        if (!adminId) {
          console.error('Admin ID not found in database result');
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
              console.error('Error deleting file:', unlinkErr);
            }
          }
          return res.status(401).json({
            success: false,
            message: 'User authentication required. Please log out and log back in to refresh your session.'
          });
        }
        
        // Continue with the upload using the fetched admin ID
        saveModelToDatabase(adminId);
      });
    }
    
    if (!created_by) {
      console.error('User ID not found in token:', {
        user: req.user,
        hasUser: !!req.user,
        userKeys: req.user ? Object.keys(req.user) : []
      });
      // Delete uploaded file if no user
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
      return res.status(401).json({
        success: false,
        message: 'User authentication required. Please log out and log back in to refresh your session.',
        debug: process.env.NODE_ENV === 'development' ? {
          hasUser: !!req.user,
          userKeys: req.user ? Object.keys(req.user) : []
        } : undefined
      });
    }
    
      // Call the function to save to database
      saveModelToDatabase(created_by);
    } catch (error) {
      console.error('Upload GLB error:', error);
      console.error('Error stack:', error.stack);
      // Delete uploaded file if error occurs
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
      return res.status(500).json({
        success: false,
        message: error.message || 'Error uploading GLB file',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
};

// Get all custom 3D models
exports.getAllCustom3DModels = (req, res) => {
  // Ensure table exists first
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    Custom3DModel.getAll((err, models) => {
      if (err) {
        console.error('Get custom 3D models error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching custom 3D models'
        });
      }
      
      res.json({
        success: true,
        models: models || []
      });
    });
  });
};

// Get custom 3D models by type
exports.getCustom3DModelsByType = (req, res) => {
  const { type } = req.params;
  Custom3DModel.getByType(type, (err, models) => {
    if (err) {
      console.error('Get custom 3D models by type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching custom 3D models'
      });
    }
    
    res.json({
      success: true,
      models: models
    });
  });
};

// Delete custom 3D model
exports.deleteCustom3DModel = (req, res) => {
  const { modelId } = req.params;
  
  // Get model info first to delete the file
  Custom3DModel.getById(modelId, (err, model) => {
    if (err || !model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }

    // Delete the file
    if (model.file_path && fs.existsSync(model.file_path)) {
      try {
        fs.unlinkSync(model.file_path);
      } catch (unlinkErr) {
        console.error('Error deleting file:', unlinkErr);
      }
    }

    // Soft delete from database
    Custom3DModel.delete(modelId, (deleteErr) => {
      if (deleteErr) {
        console.error('Error deleting model from database:', deleteErr);
        return res.status(500).json({
          success: false,
          message: 'Error deleting model'
        });
      }

      res.json({
        success: true,
        message: 'Model deleted successfully'
      });
    });
  });
};
