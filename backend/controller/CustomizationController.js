const Customization = require('../model/CustomizationModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      
      // Log the action
      const ActionLog = require('../model/ActionLogModel');
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

      ActionLog.create({
        order_item_id: itemId,
        user_id: userId,
        action_type: 'status_update',
        action_by: 'admin',
        previous_status: previousStatus,
        new_status: updateData.approvalStatus || previousStatus,
        reason: null,
        notes: `Admin updated customization order: ${actionNotes.join(', ')}`
      }, (logErr) => {
        if (logErr) {
          console.error('Error logging action:', logErr);
        }
      });
      
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
      
      // Log the action
      const ActionLog = require('../model/ActionLogModel');
      ActionLog.create({
        order_item_id: itemId,
        user_id: userId,
        action_type: 'status_update',
        action_by: 'admin',
        previous_status: previousStatus,
        new_status: status,
        reason: null,
        notes: `Admin updated customization approval status from ${previousStatus} to ${status}`
      }, (logErr) => {
        if (logErr) {
          console.error('Error logging action:', logErr);
        }
      });
      
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
