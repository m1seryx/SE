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

  // Get all order items with their details
  const sql = `
    SELECT 
      oi.item_id,
      oi.order_id,
      oi.service_type,
      oi.final_price,
      oi.approval_status,
      oi.payment_status,
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

      // Use the payment_status from database
      let paymentStatus = 'Unpaid';
      if (item.payment_status === 'paid') {
        paymentStatus = 'Paid';
      } else if (item.payment_status === 'cancelled') {
        paymentStatus = 'Cancelled';
      }

      return {
        id: item.item_id,
        uniqueNo: uniqueNo,
        customerName: `${item.first_name} ${item.last_name}`,
        serviceType: item.service_type,
        date: item.order_date ? new Date(item.order_date).toISOString().split('T')[0] : 'N/A',
        price: parseFloat(item.final_price || 0),
        status: paymentStatus
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
  const sql = `
    SELECT 
      oi.item_id,
      oi.order_id,
      oi.service_type,
      oi.final_price,
      oi.approval_status,
      oi.payment_status,
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
    WHERE o.status = ? OR oi.approval_status = ?
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
      }

      return {
        id: item.item_id,
        uniqueNo: uniqueNo,
        customerName: `${item.first_name} ${item.last_name}`,
        serviceType: item.service_type,
        date: item.order_date ? new Date(item.order_date).toISOString().split('T')[0] : 'N/A',
        price: parseFloat(item.final_price || 0),
        status: paymentStatus
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
  const validStatuses = ['Paid', 'Unpaid', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Must be: Paid, Unpaid, or Cancelled"
    });
  }

  // Convert frontend status to database value
  let dbStatus = 'unpaid';
  if (status === 'Paid') {
    dbStatus = 'paid';
  } else if (status === 'Cancelled') {
    dbStatus = 'cancelled';
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
  const statsSql = `
    SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN oi.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN oi.payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
      SUM(CASE WHEN oi.payment_status = 'paid' THEN oi.final_price ELSE 0 END) as total_revenue,
      SUM(CASE WHEN oi.payment_status = 'unpaid' THEN oi.final_price ELSE 0 END) as pending_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
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