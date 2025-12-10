const Cart = require('../model/CartModel');
const Order = require('../model/OrderModel');
const AppointmentSlot = require('../model/AppointmentSlotModel');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper function to link appointment slot to cart item
function linkAppointmentSlotToCart(userId, serviceType, specificData, cartItemId) {
  // Only for appointment-based services
  if (!['dry_cleaning', 'repair', 'customization'].includes(serviceType)) {
    return;
  }

  // Extract date and time from specificData
  const appointmentDate = specificData?.pickupDate || specificData?.preferredDate || specificData?.datetime;
  if (!appointmentDate) return;

  let date, time;
  if (appointmentDate.includes('T')) {
    const [datePart, timePart] = appointmentDate.split('T');
    date = datePart;
    // Format time to HH:MM:SS
    const timeMatch = timePart.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      time = `${timeMatch[1]}:${timeMatch[2]}:00`;
    }
  }

  if (date && time) {
    // Find and update the slot
    const sql = `
      UPDATE appointment_slots 
      SET cart_item_id = ? 
      WHERE user_id = ? 
      AND service_type = ? 
      AND appointment_date = ? 
      AND appointment_time = ? 
      AND cart_item_id IS NULL 
      AND status = 'booked'
      LIMIT 1
    `;
    db.query(sql, [cartItemId, userId, serviceType, date, time], (err) => {
      if (err) {
        console.error('Error linking appointment slot to cart item:', err);
      }
    });
  }
}

// Configure multer for file uploads
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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get user's cart
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

    // Parse JSON fields for each item
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

// Add item to cart
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
    rentalDates 
  } = req.body;

  if (!serviceType) {
    return res.status(400).json({ 
      success: false, 
      message: "Service type is required" 
    });
  }

  // For rental services, ensure downpayment is 50% of final price if not already set correctly
  if (serviceType === 'rental' && pricingFactors) {
    const totalPrice = parseFloat(finalPrice || 0);
    const currentDownpayment = parseFloat(pricingFactors.downpayment || pricingFactors.down_payment || 0);
    const expectedDownpayment = totalPrice * 0.5;
    
    // Update downpayment to 50% of total price if it doesn't match
    if (Math.abs(currentDownpayment - expectedDownpayment) > 0.01) {
      pricingFactors.downpayment = expectedDownpayment.toString();
      pricingFactors.down_payment = expectedDownpayment.toString();
    }
  }

  // Import ServiceIdGenerator
  const ServiceIdGenerator = require('../model/ServiceIdGenerator');
  
  // Generate incremental service ID for dry_cleaning, repair, and customization
  const needsIncrementalId = ['dry_cleaning', 'repair', 'customization'].includes(serviceType);
  
  if (needsIncrementalId && (!serviceId || serviceId === 1 || serviceId === '1' || (typeof serviceId === 'number' && serviceId > 1000000000))) {
    // Generate incremental service ID
    ServiceIdGenerator.getNextServiceIdFromOrders(serviceType, (err, nextId) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error generating service ID", 
          error: err 
        });
      }
      
      // Use the generated service ID
      const finalServiceId = nextId;
      
      Cart.addToCart(
        userId, 
        serviceType, 
        finalServiceId, 
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

          const cartItemId = result.insertId;

          // Link appointment slot to cart item
          linkAppointmentSlotToCart(userId, serviceType, specificData, cartItemId);

          res.json({
            success: true,
            message: "Item added to cart successfully",
            cartId: cartItemId,
            serviceId: finalServiceId
          });
        }
      );
    });
  } else {
    // Use provided service ID (for rental or if valid ID provided)
    Cart.addToCart(
      userId, 
      serviceType, 
      serviceId || 1, 
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

        const cartItemId = result.insertId;

        // Link appointment slot to cart item
        linkAppointmentSlotToCart(userId, serviceType, specificData, cartItemId);

        res.json({
          success: true,
          message: "Item added to cart successfully",
          cartId: cartItemId
        });
      }
    );
  }
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

    // Cancel appointment slot if linked to this cart item
    const cancelSlotSql = `
      UPDATE appointment_slots 
      SET status = 'cancelled' 
      WHERE cart_item_id = ? AND status = 'booked'
    `;
    db.query(cancelSlotSql, [cartItemId], (slotErr) => {
      if (slotErr) {
        console.error('Error cancelling appointment slot:', slotErr);
      }
    });

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
  const { notes, selectedCartIds } = req.body;

  // Get cart items - filter by selectedCartIds if provided
  Cart.getCartItemsForOrder(userId, (err, cartItems) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching cart items", 
        error: err 
      });
    }

    // Filter by selectedCartIds if provided
    let filteredItems = cartItems;
    if (selectedCartIds && Array.isArray(selectedCartIds) && selectedCartIds.length > 0) {
      filteredItems = cartItems.filter(item => selectedCartIds.includes(item.cart_id));
    }

    if (filteredItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No items selected or cart is empty" 
      });
    }

    // Calculate total price
    const totalPrice = filteredItems.reduce((total, item) => {
      return total + (parseFloat(item.final_price) * (item.quantity || 1));
    }, 0);

    // Create order from cart
    Order.createFromCart(userId, filteredItems, totalPrice.toString(), notes, (err, orderResult) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error creating order", 
          error: err 
        });
      }

      // Mark selected cart items as processed (set expires_at)
      if (selectedCartIds && Array.isArray(selectedCartIds) && selectedCartIds.length > 0) {
        Cart.markSelectedCartItemsAsProcessed(userId, selectedCartIds, (markErr) => {
          if (markErr) {
            console.error('Error marking cart items as processed:', markErr);
          }
        });
      } else {
        // Mark all cart items as processed
        Cart.markCartItemsAsProcessed(userId, (markErr) => {
          if (markErr) {
            console.error('Error marking cart items as processed:', markErr);
          }
        });
      }

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
