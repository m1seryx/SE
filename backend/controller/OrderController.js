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

// Update order item approval status
exports.updateItemApprovalStatus = (req, res) => {
  const itemId = req.params.id;
  const { status } = req.body;

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

  Order.updateItemApprovalStatus(itemId, status, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error updating item approval status", 
        error: err 
      });
    }

    res.json({
      success: true,
      message: "Item approval status updated successfully"
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
