const Order = require('../model/OrderModel');

// Get user's orders
exports.getUserOrders = (req, res) => {
  const userId = req.user.id;

  Order.getByUser(userId, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    res.json({
      success: true,
      message: "Orders retrieved successfully",
      orders: results
    });
  });
};

// Get all orders (admin)
exports.getAllOrders = (req, res) => {
  Order.getAll((err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    res.json({
      success: true,
      message: "All orders retrieved successfully",
      orders: results
    });
  });
};

// Get order by ID
exports.getOrderById = (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  Order.getFullOrderById(orderId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if user owns this order (unless admin)
    if (req.user.role !== 'admin' && result.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.json({
      success: true,
      message: "Order retrieved successfully",
      order: result
    });
  });
};

// Update order status
exports.updateOrderStatus = (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  // Check if order exists and user has permission
  Order.getById(orderId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = result[0];

    // Check permissions
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    Order.updateStatus(orderId, status, (err, updateResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error updating order",
          error: err
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully"
      });
    });
  });
};

// Cancel order
exports.cancelOrder = (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body;

  // Check if order exists and user has permission
  Order.getById(orderId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = result[0];

    // Check permissions
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    Order.cancelOrder(orderId, reason || 'Cancelled by user', (err, cancelResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error cancelling order",
          error: err
        });
      }

      res.json({
        success: true,
        message: "Order cancelled successfully"
      });
    });
  });
};

// Cancel order item (individual item)
exports.cancelOrderItem = (req, res) => {
  const itemId = req.params.id;
  const { reason } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!reason || reason.trim() === '') {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason is required"
    });
  }

  // Get order item to check permissions
  Order.getOrderItemById(itemId, (err, item) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found"
      });
    }

    // Get order to check user ownership
    Order.getById(item.order_id, (orderErr, orderResult) => {
      if (orderErr || !orderResult || orderResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      const order = orderResult[0];

      // Check permissions - user can only cancel their own items, admin can cancel any
      if (!isAdmin && order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only cancel your own orders."
        });
      }

      // Check if already cancelled
      if (item.approval_status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: "This order item is already cancelled"
        });
      }

      const previousStatus = item.approval_status || 'pending';

      // Cancel the order item
      Order.cancelOrderItem(itemId, reason, (cancelErr, cancelResult) => {
        if (cancelErr) {
          return res.status(500).json({
            success: false,
            message: "Error cancelling order item",
            error: cancelErr
          });
        }

        // Log the action
        const ActionLog = require('../model/ActionLogModel');
        ActionLog.create({
          order_item_id: itemId,
          user_id: userId,
          action_type: 'cancel',
          action_by: isAdmin ? 'admin' : 'user',
          previous_status: previousStatus,
          new_status: 'cancelled',
          reason: reason,
          notes: `Order item cancelled by ${isAdmin ? 'admin' : 'user'}`
        }, (logErr) => {
          if (logErr) {
            console.error('Error logging action:', logErr);
          }
        });

        // Update order tracking
        const OrderTracking = require('../model/OrderTrackingModel');
        OrderTracking.updateStatus(itemId, 'cancelled', `Cancelled: ${reason}`, userId, (trackErr) => {
          if (trackErr) {
            console.error('Error updating order tracking:', trackErr);
          }
        });

        res.json({
          success: true,
          message: "Order item cancelled successfully"
        });
      });
    });
  });
};

// Update order item approval status
exports.updateItemApprovalStatus = (req, res) => {
  const itemId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  // Only admins can approve items
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  // Get current status before updating
  Order.getOrderItemById(itemId, (getErr, item) => {
    if (getErr || !item) {
      return res.status(500).json({
        success: false,
        message: "Error fetching order item",
        error: getErr
      });
    }

    const previousStatus = item.approval_status || 'pending';

    Order.updateItemApprovalStatus(itemId, status, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error updating item approval status",
          error: err
        });
      }

      // Log the action - ALWAYS log status updates
      const ActionLog = require('../model/ActionLogModel');
      // Get admin user_id - use req.user.id if available, otherwise get from order
      const adminUserId = req.user?.id || item.user_id || null;
      
      if (!adminUserId) {
        console.error('Cannot log action: user_id is missing. req.user:', req.user, 'item.user_id:', item.user_id);
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
          notes: `Admin updated order item status from ${previousStatus} to ${status}`
        }, (logErr, logResult) => {
          if (logErr) {
            console.error('Error logging order item status update:', logErr);
            console.error('Log data:', {
              order_item_id: itemId,
              user_id: adminUserId,
              action_type: 'status_update',
              previous_status: previousStatus,
              new_status: status
            });
          } else {
            console.log('Successfully logged order item status update:', logResult?.insertId);
          }
        });
      } else {
        console.error('Skipping action log: user_id is null or undefined');
      }

      res.json({
        success: true,
        message: "Item approval status updated successfully"
      });
    });
  });
};

// Get orders by status
exports.getOrdersByStatus = (req, res) => {
  const { status } = req.query;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  Order.getByStatus(status, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    res.json({
      success: true,
      message: `Orders with status '${status}' retrieved successfully`,
      orders: results
    });
  });
};

// Get pending approval items
exports.getPendingApprovalItems = (req, res) => {
  // Only admins can view pending approvals
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  Order.getPendingApprovalItems((err, results) => {
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
      message: "Pending approval items retrieved successfully",
      items: items
    });
  });
};

// Get all repair orders (admin only)
exports.getRepairOrders = (req, res) => {
  // Only admins can view all repair orders
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  Order.getRepairOrders((err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Parse JSON fields for each item
    const orders = results.map(item => ({
      ...item,
      pricing_factors: JSON.parse(item.pricing_factors || '{}'),
      specific_data: JSON.parse(item.specific_data || '{}')
    }));

    res.json({
      success: true,
      message: "Repair orders retrieved successfully",
      orders: orders
    });
  });
};

// Get repair orders by status (admin only)
exports.getRepairOrdersByStatus = (req, res) => {
  const { status } = req.params;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  // Only admins can view repair orders by status
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  Order.getRepairOrdersByStatus(status, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Parse JSON fields for each item
    const orders = results.map(item => ({
      ...item,
      pricing_factors: JSON.parse(item.pricing_factors || '{}'),
      specific_data: JSON.parse(item.specific_data || '{}')
    }));

    res.json({
      success: true,
      message: `Repair orders with status '${status}' retrieved successfully`,
      orders: orders
    });
  });
};

// Update repair order item (admin only)
exports.updateRepairOrderItem = (req, res) => {
  const itemId = req.params.id;
  const { finalPrice, approvalStatus, adminNotes } = req.body;

  // Only admins can update repair order items
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  const updateData = {
    finalPrice: finalPrice || undefined,
    approvalStatus: approvalStatus || undefined,
    adminNotes: adminNotes || undefined
  };

  console.log("Controller - Received update data for item:", itemId, req.body);
  console.log("Controller - Processed updateData:", updateData);

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  console.log("Controller - Final updateData after cleanup:", updateData);

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one field to update is required"
    });
  }

  // Get current status before updating
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

    Order.updateRepairOrderItem(itemId, updateData, (err, result) => {
      console.log("Controller - Update result:", err, result);
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error updating repair order item",
          error: err
        });
      }

      // Log the action - ALWAYS log status updates
      const ActionLog = require('../model/ActionLogModel');
      // Get admin user_id - use req.user.id if available, otherwise get from order
      const userId = req.user?.id || item.user_id || null;
      
      if (!userId) {
        console.error('Cannot log action: user_id is missing. req.user:', req.user, 'item.user_id:', item.user_id);
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
      if (userId) {
        ActionLog.create({
          order_item_id: itemId,
          user_id: userId,
          action_type: 'status_update',
          action_by: 'admin',
          previous_status: previousStatus,
          new_status: newStatus,
          reason: null,
          notes: actionNotes.length > 0 
            ? `Admin updated repair order: ${actionNotes.join(', ')}`
            : `Admin updated repair order (status: ${newStatus})`
        }, (logErr, logResult) => {
          if (logErr) {
            console.error('Error logging repair order action:', logErr);
            console.error('Log data:', {
              order_item_id: itemId,
              user_id: userId,
              action_type: 'status_update',
              previous_status: previousStatus,
              new_status: newStatus
            });
          } else {
            console.log('Successfully logged repair order action:', logResult?.insertId);
          }
        });
      } else {
        console.error('Skipping action log: user_id is null or undefined');
      }

      console.log("Controller - Update successful, affected rows:", result?.affectedRows);
      res.json({
        success: true,
        message: "Repair order item updated successfully"
      });
    });
  });
};

// Get all dry cleaning orders (admin only)
exports.getDryCleaningOrders = (req, res) => {
  // Only admins can view all dry cleaning orders
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  Order.getDryCleaningOrders((err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Parse JSON fields for each item
    const orders = results.map(item => ({
      ...item,
      pricing_factors: JSON.parse(item.pricing_factors || '{}'),
      specific_data: JSON.parse(item.specific_data || '{}')
    }));

    res.json({
      success: true,
      message: "Dry cleaning orders retrieved successfully",
      orders: orders
    });
  });
};

// Get dry cleaning orders by status (admin only)
exports.getDryCleaningOrdersByStatus = (req, res) => {
  const { status } = req.params;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  // Only admins can view dry cleaning orders by status
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  Order.getDryCleaningOrdersByStatus(status, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Parse JSON fields for each item
    const orders = results.map(item => ({
      ...item,
      pricing_factors: JSON.parse(item.pricing_factors || '{}'),
      specific_data: JSON.parse(item.specific_data || '{}')
    }));

    res.json({
      success: true,
      message: `Dry cleaning orders with status '${status}' retrieved successfully`,
      orders: orders
    });
  });
};

// Update dry cleaning order item (admin only)
exports.updateDryCleaningOrderItem = (req, res) => {
  const itemId = req.params.id;
  const { finalPrice, approvalStatus, adminNotes } = req.body;

  // Only admins can update dry cleaning order items
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  const updateData = {
    finalPrice: finalPrice || undefined,
    approvalStatus: approvalStatus || undefined,
    adminNotes: adminNotes || undefined
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one field to update is required"
    });
  }

  // Get current status before updating
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

    Order.updateDryCleaningOrderItem(itemId, updateData, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error updating dry cleaning order item",
          error: err
        });
      }

      // Log the action - ALWAYS log status updates
      const ActionLog = require('../model/ActionLogModel');
      // Get admin user_id - use req.user.id if available, otherwise get from order
      const userId = req.user?.id || item.user_id || null;
      
      if (!userId) {
        console.error('Cannot log action: user_id is missing. req.user:', req.user, 'item.user_id:', item.user_id);
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
      if (userId) {
        ActionLog.create({
          order_item_id: itemId,
          user_id: userId,
          action_type: 'status_update',
          action_by: 'admin',
          previous_status: previousStatus,
          new_status: newStatus,
          reason: null,
          notes: actionNotes.length > 0 
            ? `Admin updated dry cleaning order: ${actionNotes.join(', ')}`
            : `Admin updated dry cleaning order (status: ${newStatus})`
        }, (logErr, logResult) => {
          if (logErr) {
            console.error('Error logging dry cleaning order action:', logErr);
            console.error('Log data:', {
              order_item_id: itemId,
              user_id: userId,
              action_type: 'status_update',
              previous_status: previousStatus,
              new_status: newStatus
            });
          } else {
            console.log('Successfully logged dry cleaning order action:', logResult?.insertId);
          }
        });
      } else {
        console.error('Skipping action log: user_id is null or undefined');
      }

      res.json({
        success: true,
        message: "Dry cleaning order item updated successfully"
      });
    });
  });
};

// Get all rental orders (admin only)
exports.getRentalOrders = (req, res) => {
  // Only admins can view all rental orders
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  Order.getRentalOrders((err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Parse JSON fields for each item
    const orders = results.map(item => ({
      ...item,
      pricing_factors: JSON.parse(item.pricing_factors || '{}'),
      specific_data: JSON.parse(item.specific_data || '{}')
    }));

    res.json({
      success: true,
      message: "Rental orders retrieved successfully",
      orders: orders
    });
  });
};

// Get rental orders by status (admin only)
exports.getRentalOrdersByStatus = (req, res) => {
  const { status } = req.params;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  // Only admins can view rental orders by status
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  Order.getRentalOrdersByStatus(status, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    // Parse JSON fields for each item
    const orders = results.map(item => ({
      ...item,
      pricing_factors: JSON.parse(item.pricing_factors || '{}'),
      specific_data: JSON.parse(item.specific_data || '{}')
    }));

    res.json({
      success: true,
      message: `Rental orders with status '${status}' retrieved successfully`,
      orders: orders
    });
  });
};

// Update rental order item (admin only)
exports.updateRentalOrderItem = (req, res) => {
  const itemId = req.params.id;
  const { approvalStatus, adminNotes } = req.body;

  console.log("Controller - Updating rental order item:", itemId, req.body);

  // Only admins can update rental order items
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  const updateData = {
    approvalStatus: approvalStatus || undefined,
    adminNotes: adminNotes || undefined
  };

  console.log("Controller - Processed updateData:", updateData);

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  console.log("Controller - Final updateData after cleanup:", updateData);

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one field to update is required"
    });
  }

  // Get current status before updating
  Order.getOrderItemById(itemId, (getErr, item) => {
    if (getErr || !item) {
      return res.status(500).json({
        success: false,
        message: "Error fetching order item",
        error: getErr
      });
    }

    const previousStatus = item.approval_status || 'pending';

    Order.updateRentalOrderItem(itemId, updateData, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error updating rental order item",
          error: err
        });
      }

      // Log the action - ALWAYS log status updates
      const ActionLog = require('../model/ActionLogModel');
      // Get admin user_id - use req.user.id if available, otherwise get from order
      const userId = req.user?.id || item.user_id || null;
      
      if (!userId) {
        console.error('Cannot log action: user_id is missing. req.user:', req.user, 'item.user_id:', item.user_id);
      }
      
      let actionNotes = [];
      
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        actionNotes.push(`Status: ${previousStatus} → ${updateData.approvalStatus}`);
      }
      if (updateData.adminNotes) {
        actionNotes.push(`Admin notes: ${updateData.adminNotes}`);
      }

      // Always log, even if status didn't change (for tracking)
      const newStatus = updateData.approvalStatus || previousStatus;

      // Only log if we have a valid user_id
      if (userId) {
        ActionLog.create({
          order_item_id: itemId,
          user_id: userId,
          action_type: 'status_update',
          action_by: 'admin',
          previous_status: previousStatus,
          new_status: newStatus,
          reason: null,
          notes: actionNotes.length > 0 
            ? `Admin updated rental order: ${actionNotes.join(', ')}`
            : `Admin updated rental order (status: ${newStatus})`
        }, (logErr, logResult) => {
          if (logErr) {
            console.error('Error logging rental order action:', logErr);
            console.error('Log data:', {
              order_item_id: itemId,
              user_id: userId,
              action_type: 'status_update',
              previous_status: previousStatus,
              new_status: newStatus
            });
          } else {
            console.log('Successfully logged rental order action:', logResult?.insertId);
          }
        });
      } else {
        console.error('Skipping action log: user_id is null or undefined');
      }

      res.json({
        success: true,
        message: "Rental order item updated successfully"
      });
    });
  });
};

// Get order item details by item ID
exports.getOrderItemDetails = (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  Order.getOrderItemById(itemId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Order item not found"
      });
    }

    // Check if user owns this order item (unless admin)
    if (req.user.role !== 'admin' && result.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Parse JSON fields
    const orderItem = {
      ...result,
      pricing_factors: JSON.parse(result.pricing_factors || '{}'),
      specific_data: JSON.parse(result.specific_data || '{}')
    };

    res.json({
      success: true,
      message: "Order item details retrieved successfully",
      order_item: orderItem
    });
  });
};

