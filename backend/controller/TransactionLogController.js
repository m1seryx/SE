const TransactionLog = require('../model/TransactionLogModel');

// Get transaction logs for an order item
exports.getTransactionLogsByOrderItem = (req, res) => {
  const { orderItemId } = req.params;
  
  // Check if user has access (admin or owner)
  if (req.user.role !== 'admin') {
    // For non-admin users, verify they own the order item
    const Order = require('../model/OrderModel');
    Order.getOrderItemById(orderItemId, (err, item) => {
      if (err || !item) {
        return res.status(500).json({
          success: false,
          message: "Error fetching order item"
        });
      }
      
      if (item.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
      
      // User owns the item, proceed
      TransactionLog.getByOrderItemId(orderItemId, (logErr, logs) => {
        if (logErr) {
          return res.status(500).json({
            success: false,
            message: "Error fetching transaction logs",
            error: logErr
          });
        }
        
        res.json({
          success: true,
          message: "Transaction logs retrieved successfully",
          logs: logs || []
        });
      });
    });
  } else {
    // Admin can access any order item
    TransactionLog.getByOrderItemId(orderItemId, (err, logs) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching transaction logs",
          error: err
        });
      }
      
      res.json({
        success: true,
        message: "Transaction logs retrieved successfully",
        logs: logs || []
      });
    });
  }
};

// Get transaction logs for current user
exports.getMyTransactionLogs = (req, res) => {
  const userId = req.user.id;
  
  TransactionLog.getByUserId(userId, (err, logs) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transaction logs",
        error: err
      });
    }
    
    res.json({
      success: true,
      message: "Transaction logs retrieved successfully",
      logs: logs || []
    });
  });
};

// Get all transaction logs (admin only)
exports.getAllTransactionLogs = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }
  
  TransactionLog.getAll((err, logs) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transaction logs",
        error: err
      });
    }
    
    res.json({
      success: true,
      message: "Transaction logs retrieved successfully",
      logs: logs || []
    });
  });
};

// Get transaction summary for an order item
exports.getTransactionSummary = (req, res) => {
  const { orderItemId } = req.params;
  
  // Check if user has access (admin or owner)
  if (req.user.role !== 'admin') {
    const Order = require('../model/OrderModel');
    Order.getOrderItemById(orderItemId, (err, item) => {
      if (err || !item) {
        return res.status(500).json({
          success: false,
          message: "Error fetching order item"
        });
      }
      
      if (item.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
      
      TransactionLog.getSummaryByOrderItemId(orderItemId, (summaryErr, summary) => {
        if (summaryErr) {
          return res.status(500).json({
            success: false,
            message: "Error fetching transaction summary",
            error: summaryErr
          });
        }
        
        res.json({
          success: true,
          message: "Transaction summary retrieved successfully",
          summary: summary[0] || { total_transactions: 0, total_amount: 0, last_transaction_date: null }
        });
      });
    });
  } else {
    TransactionLog.getSummaryByOrderItemId(orderItemId, (err, summary) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error fetching transaction summary",
          error: err
        });
      }
      
      res.json({
        success: true,
        message: "Transaction summary retrieved successfully",
        summary: summary[0] || { total_transactions: 0, total_amount: 0, last_transaction_date: null }
      });
    });
  }
};

