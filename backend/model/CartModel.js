const db = require('../config/db');

const Cart = {
  // Get user's cart items
  getUserCart: (userId, callback) => {
    const sql = `
      SELECT 
        c.*,
        DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(c.expires_at, '%Y-%m-%d %H:%i:%s') as expires_at
      FROM cart c
      WHERE c.user_id = ? AND (c.expires_at IS NULL OR c.expires_at > NOW())
      ORDER BY c.created_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Add item to cart
  addToCart: (userId, serviceType, serviceId, quantity, basePrice, finalPrice, pricingFactors, specificData, rentalDates, callback) => {
    // Debug: Log parameters
    console.log('Cart model addToCart params:', { userId, serviceType, serviceId, quantity, basePrice, finalPrice });
    
    // Modified to use duration_days instead of rental_start_date and rental_end_date
    const sql = `
      INSERT INTO cart (
        user_id, service_type, service_id, quantity, base_price, final_price,
        duration_days, pricing_factors, specific_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    // Extract duration from either rentalDates or pricingFactors for backward compatibility
    let durationDays = null;
    if (rentalDates && typeof rentalDates === 'object' && rentalDates.startDate && rentalDates.endDate) {
      // Calculate duration from start and end dates for backward compatibility
      const startDate = new Date(rentalDates.startDate);
      const endDate = new Date(rentalDates.endDate);
      durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    } else if (pricingFactors && pricingFactors.days) {
      // Use duration from pricing factors
      durationDays = pricingFactors.days;
    } else if (specificData && specificData.duration_days) {
      // Use duration from specific data
      durationDays = specificData.duration_days;
    }
    
    const values = [
      userId, serviceType, serviceId, quantity || 1, basePrice, finalPrice,
      durationDays, // Store duration days instead of start/end dates
      JSON.stringify(pricingFactors || {}), JSON.stringify(specificData || {})
    ];
    
    db.query(sql, values, callback);
  },

  // Update cart item
  updateCartItem: (cartItemId, userId, updates, callback) => {
    let sql = "UPDATE cart SET ";
    const values = [];
    const setClauses = [];

    if (updates.quantity !== undefined) {
      setClauses.push("quantity = ?");
      values.push(updates.quantity);
    }
    if (updates.final_price !== undefined) {
      setClauses.push("final_price = ?");
      values.push(updates.final_price);
    }
    if (updates.appointment_date !== undefined) {
      setClauses.push("appointment_date = ?");
      values.push(updates.appointment_date);
    }
    // Updated to use duration_days instead of rental_start_date and rental_end_date
    if (updates.duration_days !== undefined) {
      setClauses.push("duration_days = ?");
      values.push(updates.duration_days);
    }
    // Kept for backward compatibility
    if (updates.rental_start_date !== undefined || updates.rental_end_date !== undefined) {
      // Convert dates to duration if both are provided
      if (updates.rental_start_date !== undefined && updates.rental_end_date !== undefined) {
        const startDate = new Date(updates.rental_start_date);
        const endDate = new Date(updates.rental_end_date);
        const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        setClauses.push("duration_days = ?");
        values.push(durationDays);
      }
    }
    if (updates.pricing_factors !== undefined) {
      setClauses.push("pricing_factors = ?");
      values.push(JSON.stringify(updates.pricing_factors));
    }
    if (updates.specific_data !== undefined) {
      setClauses.push("specific_data = ?");
      values.push(JSON.stringify(updates.specific_data));
    }

    setClauses.push("updated_at = NOW()");
    sql += setClauses.join(", ") + " WHERE cart_id = ? AND user_id = ?";
    values.push(cartItemId, userId);

    db.query(sql, values, callback);
  },

  // Remove item from cart
  removeFromCart: (cartItemId, userId, callback) => {
    const sql = "DELETE FROM cart WHERE cart_id = ? AND user_id = ?";
    db.query(sql, [cartItemId, userId], callback);
  },

  // Clear entire cart
  clearCart: (userId, callback) => {
    const sql = "DELETE FROM cart WHERE user_id = ?";
    db.query(sql, [userId], callback);
  },

  // Get cart summary
  getCartSummary: (userId, callback) => {
    const sql = `
      SELECT 
        COUNT(*) as item_count,
        SUM(CAST(final_price AS DECIMAL(10,2))) as total_amount
      FROM cart 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;
    db.query(sql, [userId], callback);
  },

  // Get cart item by ID
  getCartItemById: (cartItemId, userId, callback) => {
    const sql = `
      SELECT * FROM cart 
      WHERE cart_id = ? AND user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;
    db.query(sql, [cartItemId, userId], callback);
  },

  // Get cart items for order submission
  getCartItemsForOrder: (userId, callback) => {
    const sql = `
      SELECT 
        cart_id,
        service_type,
        service_id,
        quantity,
        base_price,
        final_price,
        appointment_date,
        duration_days,  -- Changed from rental_start_date and rental_end_date
        pricing_factors,
        specific_data
      FROM cart 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at ASC
    `;
    db.query(sql, [userId], callback);
  },

  // Mark cart items as processed (set expires_at to now)
  markCartItemsAsProcessed: (userId, callback) => {
    const sql = `
      UPDATE cart 
      SET expires_at = NOW() 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;
    db.query(sql, [userId], callback);
  }
};

module.exports = Cart;