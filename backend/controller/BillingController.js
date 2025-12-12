const Order = require('../model/OrderModel');
const db = require('../config/db');

// Get all billing records (admin only)
exports.getAllBillingRecords = (req, res) => {
  // Only admins can view all billing records
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  // Get all order items with their details including specific_data and pricing_factors
  // Exclude rejected/cancelled items from billing
  const sql = `
    SELECT 
      oi.item_id,
      oi.order_id,
      oi.service_type,
      oi.final_price,
      oi.base_price,
      oi.approval_status,
      oi.payment_status,
      oi.specific_data,
      oi.pricing_factors,
      oi.rental_start_date,
      oi.rental_end_date,
      o.status as order_status,
      o.order_date,
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN user u ON o.user_id = u.user_id
    WHERE oi.approval_status != 'cancelled'
    ORDER BY o.order_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Transform data into billing records
    const billingRecords = results.map(item => {
      // Generate unique number based on service type and item_id
      let uniqueNo = "";
      switch(item.service_type.toLowerCase()) {
        case 'customize':
        case 'customization':
          uniqueNo = `C${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'dry_cleaning':
        case 'drycleaning':
        case 'dry-cleaning':
        case 'dry cleaning':
          uniqueNo = `D${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'repair':
          uniqueNo = `R${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'rental':
          uniqueNo = `RN${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        default:
          uniqueNo = `S${item.item_id}${Math.floor(Math.random() * 1000)}`;
      }

      // Parse JSON fields first (needed for payment status check)
      let specificData = {};
      let pricingFactors = {};
      try {
        specificData = item.specific_data ? JSON.parse(item.specific_data) : {};
        pricingFactors = item.pricing_factors ? JSON.parse(item.pricing_factors) : {};
      } catch (e) {
        console.error('Error parsing JSON fields:', e);
      }

      // Determine payment status - for rental, check if balance = 0
      let paymentStatus = 'Unpaid';
      const normalizedServiceType = (item.service_type || '').toLowerCase().trim();
      
      if (normalizedServiceType === 'rental') {
        // Check amount_paid from pricing_factors
        const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
        const finalPrice = parseFloat(item.final_price || 0);
        const remainingBalance = finalPrice - amountPaid;
        
        // If balance is zero or negative (overpaid), mark as Paid
        if (remainingBalance <= 0 && finalPrice > 0) {
          paymentStatus = 'Paid';
        } else if (item.payment_status === 'fully_paid') {
          paymentStatus = 'Fully Paid';
        } else if (item.payment_status === 'down-payment') {
          paymentStatus = 'Down-payment';
        } else if (item.payment_status === 'partial_payment') {
          paymentStatus = 'Partial Payment';
        } else {
          paymentStatus = 'Unpaid';
        }
      } else {
        // For other services, use payment_status from database
        if (item.payment_status === 'paid') {
          paymentStatus = 'Paid';
        } else if (item.payment_status === 'cancelled') {
          paymentStatus = 'Cancelled';
        } else if (item.payment_status === 'down-payment') {
          paymentStatus = 'Down-payment';
        } else if (item.payment_status === 'fully_paid') {
          paymentStatus = 'Fully Paid';
        }
      }

      // Format service type for display
      let serviceTypeDisplay = item.service_type;
      switch(item.service_type.toLowerCase()) {
        case 'dry_cleaning':
        case 'drycleaning':
        case 'dry-cleaning':
          serviceTypeDisplay = 'Dry Cleaning';
          break;
        case 'customize':
        case 'customization':
          serviceTypeDisplay = 'Customization';
          break;
        case 'repair':
          serviceTypeDisplay = 'Repair';
          break;
        case 'rental':
          serviceTypeDisplay = 'Rental';
          break;
        default:
          serviceTypeDisplay = item.service_type.charAt(0).toUpperCase() + item.service_type.slice(1);
      }

      return {
        id: item.item_id,
        uniqueNo: uniqueNo,
        customerName: `${item.first_name} ${item.last_name}`,
        serviceType: item.service_type,
        serviceTypeDisplay: serviceTypeDisplay,
        date: item.order_date ? new Date(item.order_date).toISOString().split('T')[0] : 'N/A',
        price: parseFloat(item.final_price || 0),
        basePrice: parseFloat(item.base_price || 0),
        status: paymentStatus,
        specificData: specificData,
        pricingFactors: pricingFactors,
        rentalStartDate: item.rental_start_date,
        rentalEndDate: item.rental_end_date
      };
    });

    res.json({
      success: true,
      message: "Billing records retrieved successfully",
      records: billingRecords
    });
  });
};

// Get billing records by status (admin only)
exports.getBillingRecordsByStatus = (req, res) => {
  const { status } = req.params;

  // Only admins can view billing records
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  // Get order items with specific status
  // Exclude rejected/cancelled items from billing
  const sql = `
    SELECT 
      oi.item_id,
      oi.order_id,
      oi.service_type,
      oi.final_price,
      oi.base_price,
      oi.approval_status,
      oi.payment_status,
      oi.specific_data,
      oi.pricing_factors,
      oi.rental_start_date,
      oi.rental_end_date,
      o.status as order_status,
      o.order_date,
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN user u ON o.user_id = u.user_id
    WHERE (o.status = ? OR oi.approval_status = ?)
      AND oi.approval_status != 'cancelled'
    ORDER BY o.order_date DESC
  `;

  db.query(sql, [status, status], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Transform data into billing records
    const billingRecords = results.map(item => {
      // Generate unique number based on service type and item_id
      let uniqueNo = "";
      switch(item.service_type.toLowerCase()) {
        case 'customize':
        case 'customization':
          uniqueNo = `C${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'dry_cleaning':
        case 'drycleaning':
        case 'dry-cleaning':
        case 'dry cleaning':
          uniqueNo = `D${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'repair':
          uniqueNo = `R${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'rental':
          uniqueNo = `RN${item.item_id}${Math.floor(Math.random() * 1000)}`;
          break;
        default:
          uniqueNo = `S${item.item_id}${Math.floor(Math.random() * 1000)}`;
      }

      // Use the payment_status from database
      let paymentStatus = 'Unpaid';
      if (item.payment_status === 'paid') {
        paymentStatus = 'Paid';
      } else if (item.payment_status === 'cancelled') {
        paymentStatus = 'Cancelled';
      } else if (item.payment_status === 'down-payment') {
        paymentStatus = 'Down-payment';
      } else if (item.payment_status === 'fully_paid') {
        paymentStatus = 'Fully Paid';
      }

      // Parse JSON fields
      let specificData = {};
      let pricingFactors = {};
      try {
        specificData = item.specific_data ? JSON.parse(item.specific_data) : {};
        pricingFactors = item.pricing_factors ? JSON.parse(item.pricing_factors) : {};
      } catch (e) {
        console.error('Error parsing JSON fields:', e);
      }

      // Format service type for display
      let serviceTypeDisplay = item.service_type;
      switch(item.service_type.toLowerCase()) {
        case 'dry_cleaning':
        case 'drycleaning':
        case 'dry-cleaning':
          serviceTypeDisplay = 'Dry Cleaning';
          break;
        case 'customize':
        case 'customization':
          serviceTypeDisplay = 'Customization';
          break;
        case 'repair':
          serviceTypeDisplay = 'Repair';
          break;
        case 'rental':
          serviceTypeDisplay = 'Rental';
          break;
        default:
          serviceTypeDisplay = item.service_type.charAt(0).toUpperCase() + item.service_type.slice(1);
      }

      return {
        id: item.item_id,
        uniqueNo: uniqueNo,
        customerName: `${item.first_name} ${item.last_name}`,
        serviceType: item.service_type,
        serviceTypeDisplay: serviceTypeDisplay,
        date: item.order_date ? new Date(item.order_date).toISOString().split('T')[0] : 'N/A',
        price: parseFloat(item.final_price || 0),
        basePrice: parseFloat(item.base_price || 0),
        status: paymentStatus,
        specificData: specificData,
        pricingFactors: pricingFactors,
        rentalStartDate: item.rental_start_date,
        rentalEndDate: item.rental_end_date
      };
    });

    res.json({
      success: true,
      message: `Billing records with status '${status}' retrieved successfully`,
      records: billingRecords
    });
  });
};

// Update billing record payment status (admin only)
exports.updateBillingRecordStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Only admins can update billing records
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  // Validate status
  const validStatuses = ['Paid', 'Unpaid', 'Cancelled', 'Down-payment', 'Fully Paid'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Must be: Paid, Unpaid, Cancelled, Down-payment, or Fully Paid"
    });
  }

  // Convert frontend status to database value
  let dbStatus = 'unpaid';
  if (status === 'Paid') {
    dbStatus = 'paid';
  } else if (status === 'Cancelled') {
    dbStatus = 'cancelled';
  } else if (status === 'Down-payment') {
    dbStatus = 'down-payment';
  } else if (status === 'Fully Paid') {
    dbStatus = 'fully_paid';
  }

  // Update the payment_status in the database
  const sql = `UPDATE order_items SET payment_status = ? WHERE item_id = ?`;
  db.query(sql, [dbStatus, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error updating payment status",
        error: err
      });
    }

    res.json({
      success: true,
      message: `Billing record status updated to ${status}`
    });
  });
};

// Get billing statistics (admin only)
exports.getBillingStats = (req, res) => {
  // Only admins can view billing stats
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  // Get statistics query
  // Exclude rejected/cancelled items from billing statistics
  const statsSql = `
    SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN oi.payment_status IN ('paid', 'fully_paid') THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN oi.payment_status IN ('unpaid', 'down-payment') THEN 1 ELSE 0 END) as unpaid_count,
      SUM(CASE WHEN oi.payment_status IN ('paid', 'fully_paid') THEN oi.final_price ELSE 0 END) as total_revenue,
      SUM(CASE WHEN oi.payment_status IN ('unpaid', 'down-payment') THEN oi.final_price ELSE 0 END) as pending_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.approval_status != 'cancelled'
  `;

  db.query(statsSql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    const stats = results[0];

    res.json({
      success: true,
      message: "Billing statistics retrieved successfully",
      stats: {
        total: parseInt(stats.total_records) || 0,
        paid: parseInt(stats.paid_count) || 0,
        unpaid: parseInt(stats.unpaid_count) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        pendingRevenue: parseFloat(stats.pending_revenue) || 0
      }
    });
  });
};