const TransactionLog = require('../model/TransactionLogModel');
const db = require('../config/db');
const billingHelper = require('../utils/billingHelper');

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

// Make a payment for an order item (allows custom amounts)
exports.makePayment = (req, res) => {
  const { orderItemId } = req.params;
  const { amount, payment_method, notes } = req.body;
  
  // Validate amount
  const paymentAmount = parseFloat(amount);
  if (!paymentAmount || paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment amount. Amount must be greater than 0."
    });
  }
  
  // Get order item details
  const getItemSql = `
    SELECT 
      oi.item_id,
      oi.final_price, 
      oi.payment_status, 
      oi.service_type,
      oi.order_id,
      o.user_id
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.item_id = ?
  `;
  
  db.query(getItemSql, [orderItemId], (getErr, items) => {
    if (getErr || !items || items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order item not found"
      });
    }
    
    const item = items[0];
    
    // Check if user has access (admin or owner)
    if (req.user.role !== 'admin' && item.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    // Get total amount already paid from transaction logs
    TransactionLog.getSummaryByOrderItemId(orderItemId, (summaryErr, summary) => {
      if (summaryErr) {
        return res.status(500).json({
          success: false,
          message: "Error fetching payment summary",
          error: summaryErr
        });
      }
      
      const totalPaid = parseFloat(summary[0]?.total_amount || 0);
      const finalPrice = parseFloat(item.final_price || 0);
      const newTotalPaid = totalPaid + paymentAmount;
      
      // Check if payment exceeds final price
      if (newTotalPaid > finalPrice) {
        return res.status(400).json({
          success: false,
          message: `Payment amount exceeds remaining balance. Total price: ₱${finalPrice.toFixed(2)}, Already paid: ₱${totalPaid.toFixed(2)}, Remaining: ₱${(finalPrice - totalPaid).toFixed(2)}`
        });
      }
      
      // Determine new payment status based on total paid
      let newPaymentStatus = item.payment_status || 'unpaid';
      const normalizedServiceType = (item.service_type || '').toLowerCase().trim();
      
      if (normalizedServiceType === 'rental') {
        // For rental: down-payment if less than 50%, fully_paid if >= 100%
        const downpaymentAmount = finalPrice * 0.5;
        if (newTotalPaid >= finalPrice) {
          newPaymentStatus = 'fully_paid';
        } else if (newTotalPaid >= downpaymentAmount) {
          newPaymentStatus = 'down-payment';
        } else {
          newPaymentStatus = 'partial_payment';
        }
      } else {
        // For other services: paid if >= 100%, partial if < 100%
        if (newTotalPaid >= finalPrice) {
          newPaymentStatus = 'paid';
        } else {
          newPaymentStatus = 'partial_payment';
        }
      }
      
      // Create transaction log
      TransactionLog.create({
        order_item_id: orderItemId,
        user_id: item.user_id,
        transaction_type: 'payment',
        amount: paymentAmount,
        previous_payment_status: item.payment_status || 'unpaid',
        new_payment_status: newPaymentStatus,
        payment_method: payment_method || 'cash',
        notes: notes || `Manual payment of ₱${paymentAmount.toFixed(2)}`,
        created_by: req.user.role === 'admin' ? 'admin' : 'user'
      }, (logErr, logResult) => {
        // Create action log for dashboard
        if (!logErr) {
          const ActionLog = require('../model/ActionLogModel');
          const paymentMethodLabel = payment_method === 'cash' ? 'Cash' : 
                                     payment_method === 'card' ? 'Card' : 
                                     payment_method === 'online' ? 'Online' : 
                                     payment_method || 'Cash';
          ActionLog.create({
            order_item_id: orderItemId,
            user_id: item.user_id,
            action_type: 'payment',
            action_by: req.user.role === 'admin' ? 'admin' : 'user',
            previous_status: item.payment_status || 'unpaid',
            new_status: newPaymentStatus,
            reason: null,
            notes: `Payment of ₱${paymentAmount.toFixed(2)} via ${paymentMethodLabel}. Status: ${item.payment_status || 'unpaid'} → ${newPaymentStatus}`
          }, (actionLogErr) => {
            if (actionLogErr) {
              console.error('Error creating payment action log:', actionLogErr);
            } else {
              console.log('Payment action log created successfully');
            }
          });
        }
        
        // Create payment success notification
        if (!logErr && item.user_id) {
          const Notification = require('../model/NotificationModel');
          const serviceType = (item.service_type || 'customize').toLowerCase().trim();
          Notification.createPaymentSuccessNotification(
            item.user_id,
            orderItemId,
            paymentAmount,
            payment_method || 'cash',
            serviceType,
            (notifErr) => {
              if (notifErr) {
                console.error('[NOTIFICATION] Failed to create payment success notification:', notifErr);
              } else {
                console.log('[NOTIFICATION] Payment success notification created');
              }
            }
          );
        }
        
        if (logErr) {
          return res.status(500).json({
            success: false,
            message: "Error creating transaction log",
            error: logErr
          });
        }
        
        // Update payment_status in order_items
        const updateSql = `UPDATE order_items SET payment_status = ? WHERE item_id = ?`;
        db.query(updateSql, [newPaymentStatus, orderItemId], (updateErr, updateResult) => {
          if (updateErr) {
            return res.status(500).json({
              success: false,
              message: "Error updating payment status",
              error: updateErr
            });
          }
          
          // Get updated summary
          TransactionLog.getSummaryByOrderItemId(orderItemId, (finalSummaryErr, finalSummary) => {
            const finalTotalPaid = parseFloat(finalSummary[0]?.total_amount || 0);
            const remaining = finalPrice - finalTotalPaid;
            
            res.json({
              success: true,
              message: "Payment recorded successfully",
              payment: {
                amount: paymentAmount,
                total_paid: finalTotalPaid,
                remaining: Math.max(0, remaining),
                payment_status: newPaymentStatus,
                transaction_id: logResult.insertId
              }
            });
          });
        });
      });
    });
  });
};

