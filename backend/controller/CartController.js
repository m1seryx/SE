const Cart = require('../model/CartModel');
const Order = require('../model/OrderModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/cart-items/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cart-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

exports.getUserCart = (req, res) => {
  const userId = req.user.id;
  
  Cart.getUserCart(userId, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    const items = results.map(item => ({
      ...item,
      pricing_factors: JSON.parse(item.pricing_factors || '{}'),
      specific_data: JSON.parse(item.specific_data || '{}')
    }));

    res.json({
      success: true,
      message: "Cart retrieved successfully",
      items: items
    });
  });
};


exports.addToCart = (req, res) => {
  const userId = req.user.id;
  const { 
    serviceType, 
    serviceId, 
    quantity, 
    basePrice, 
    finalPrice, 
    pricingFactors, 
    specificData,
    rentalDates,
    durationDays // Added durationDays parameter
  } = req.body;

  if (!serviceType || !serviceId) {
    return res.status(400).json({ 
      success: false, 
      message: "Service type and service ID are required" 
    });
  }

  Cart.addToCart(
    userId, 
    serviceType, 
    serviceId, 
    quantity, 
    basePrice, 
    finalPrice, 
    pricingFactors, 
    specificData, 
    rentalDates,
    (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error adding item to cart", 
          error: err 
        });
      }

      res.json({
        success: true,
        message: "Item added to cart successfully",
        cartId: result.insertId
      });
    }
  );
};

// Update cart item
exports.updateCartItem = (req, res) => {
  const userId = req.user.id;
  const cartItemId = req.params.id;
  const updates = req.body;

  // Check if item exists and belongs to user
  Cart.getCartItemById(cartItemId, userId, (err, itemResult) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    if (itemResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart item not found" 
      });
    }

    Cart.updateCartItem(cartItemId, userId, updates, (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error updating cart item", 
          error: err 
        });
      }

      res.json({
        success: true,
        message: "Cart item updated successfully"
      });
    });
  });
};

// Remove item from cart
exports.removeFromCart = (req, res) => {
  const userId = req.user.id;
  const cartItemId = req.params.id;

  Cart.getCartItemById(cartItemId, userId, (err, itemResult) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    if (itemResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart item not found" 
      });
    }

    Cart.removeFromCart(cartItemId, userId, (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error removing item from cart", 
          error: err 
        });
      }

      res.json({
        success: true,
        message: "Item removed from cart successfully"
      });
    });
  });
};

// Clear entire cart
exports.clearCart = (req, res) => {
  const userId = req.user.id;

  Cart.clearCart(userId, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error clearing cart", 
        error: err 
      });
    }

    res.json({
      success: true,
      message: "Cart cleared successfully"
    });
  });
};

// Get cart summary
exports.getCartSummary = (req, res) => {
  const userId = req.user.id;

  Cart.getCartSummary(userId, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    const summary = results[0] || { item_count: 0, total_amount: 0 };

    res.json({
      success: true,
      message: "Cart summary retrieved successfully",
      itemCount: summary.item_count || 0,
      totalAmount: parseFloat(summary.total_amount) || 0
    });
  });
};

// Submit cart as order
exports.submitCart = (req, res) => {
  const userId = req.user.id;
  const { notes, appointmentDate } = req.body;

  // Validate appointment date if provided
  if (appointmentDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointmentDate)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid appointment date format. Use YYYY-MM-DD" 
      });
    }
    
    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return res.status(400).json({ 
        success: false, 
        message: "Appointment date cannot be in the past" 
      });
    }
  }

  // Get cart items
  Cart.getCartItemsForOrder(userId, (err, cartItems) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching cart items", 
        error: err 
      });
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Cart is empty" 
      });
    }

    // Add appointment date to each cart item if not already present
    const updatedCartItems = cartItems.map(item => {
      // Only add appointment date if the item doesn't already have one
      if (!item.appointment_date && appointmentDate) {
        return { ...item, appointment_date: appointmentDate };
      }
      return item;
    });

    // Calculate total price
    const totalPrice = updatedCartItems.reduce((total, item) => {
      return total + (parseFloat(item.final_price) * (item.quantity || 1));
    }, 0);

    // Create order from cart
    Order.createFromCart(userId, updatedCartItems, totalPrice.toString(), notes, (err, orderResult) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error creating order", 
          error: err 
        });
      }

      // Mark cart items as processed
      Cart.markCartItemsAsProcessed(userId, (markErr) => {
        if (markErr) {
          console.error('Error marking cart items as processed:', markErr);
        }
      });

      res.json({
        success: true,
        message: "Order created successfully",
        orderId: orderResult.orderId
      });
    });
  });
};

// Upload file for cart item
exports.uploadCartItemFile = (req, res) => {
  const userId = req.user.id;
  const cartItemId = req.body.itemId;

  console.log('Cart upload request:', {
    userId,
    cartItemId,
    body: req.body,
    file: req.file
  });

  if (!cartItemId) {
    return res.status(400).json({ 
      success: false, 
      message: "Item ID is required" 
    });
  }

  // Check if item exists and belongs to user
  Cart.getCartItemById(cartItemId, userId, (err, itemResult) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    if (itemResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart item not found" 
      });
    }

    // File upload middleware will handle the actual upload
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false, 
          message: "File upload error", 
          error: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
      }

      const fileUrl = `/uploads/cart-items/${req.file.filename}`;

      res.json({
        success: true,
        message: "File uploaded successfully",
        fileUrl: fileUrl
      });
    });
  });
};

// Export upload middleware for use in routes
exports.upload = upload;