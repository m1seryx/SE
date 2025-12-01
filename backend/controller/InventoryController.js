const db = require('../config/db');

// Get all completed items (excluding rental) for inventory
exports.getCompletedItems = (req, res) => {
  // Only admins can view inventory
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  // Query to get all completed items except rental items
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
    WHERE oi.service_type != 'rental' 
    AND (oi.approval_status = 'completed' OR o.status = 'completed')
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

    // Transform data into inventory items
    const inventoryItems = results.map(item => {
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
        default:
          uniqueNo = `S${item.item_id}${Math.floor(Math.random() * 1000)}`;
      }

      return {
        id: item.item_id,
        uniqueNo: uniqueNo,
        customerName: `${item.first_name} ${item.last_name}`,
        serviceType: item.service_type,
        date: item.order_date ? new Date(item.order_date).toISOString().split('T')[0] : 'N/A',
        price: parseFloat(item.final_price || 0),
        status: item.approval_status || item.order_status
      };
    });

    res.json({
      success: true,
      message: "Inventory items retrieved successfully",
      items: inventoryItems
    });
  });
};

// Get inventory items by service type
exports.getItemsByServiceType = (req, res) => {
  const { serviceType } = req.params;

  // Only admins can view inventory
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  if (!serviceType) {
    return res.status(400).json({
      success: false,
      message: "Service type is required"
    });
  }

  // Query to get items by service type (excluding rental)
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
    WHERE oi.service_type = ? 
    AND oi.service_type != 'rental'
    AND (oi.approval_status = 'completed' OR o.status = 'completed')
    ORDER BY o.order_date DESC
  `;

  db.query(sql, [serviceType], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Transform data into inventory items
    const inventoryItems = results.map(item => {
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
        default:
          uniqueNo = `S${item.item_id}${Math.floor(Math.random() * 1000)}`;
      }

      return {
        id: item.item_id,
        uniqueNo: uniqueNo,
        customerName: `${item.first_name} ${item.last_name}`,
        serviceType: item.service_type,
        date: item.order_date ? new Date(item.order_date).toISOString().split('T')[0] : 'N/A',
        price: parseFloat(item.final_price || 0),
        status: item.approval_status || item.order_status
      };
    });

    res.json({
      success: true,
      message: `Inventory items for ${serviceType} retrieved successfully`,
      items: inventoryItems
    });
  });
};

// Get inventory statistics
exports.getInventoryStats = (req, res) => {
  // Only admins can view inventory stats
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  // Get statistics query
  const statsSql = `
    SELECT 
      COUNT(*) as total_items,
      SUM(CASE WHEN oi.service_type = 'customization' OR oi.service_type = 'customize' THEN 1 ELSE 0 END) as customization_count,
      SUM(CASE WHEN oi.service_type LIKE '%dry%' THEN 1 ELSE 0 END) as dry_cleaning_count,
      SUM(CASE WHEN oi.service_type = 'repair' THEN 1 ELSE 0 END) as repair_count,
      SUM(oi.final_price) as total_value
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.service_type != 'rental' 
    AND (oi.approval_status = 'completed' OR o.status = 'completed')
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
      message: "Inventory statistics retrieved successfully",
      stats: {
        total: parseInt(stats.total_items) || 0,
        customization: parseInt(stats.customization_count) || 0,
        dryCleaning: parseInt(stats.dry_cleaning_count) || 0,
        repair: parseInt(stats.repair_count) || 0,
        totalValue: parseFloat(stats.total_value) || 0
      }
    });
  });
};