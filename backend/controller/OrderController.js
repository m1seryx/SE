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

      // Update billing status if status changed
      const billingHelper = require('../utils/billingHelper');
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        const serviceType = (item.service_type || 'repair').toLowerCase().trim();
        console.log(`[BILLING] ===== STARTING BILLING UPDATE FOR REPAIR =====`);
        console.log(`[BILLING] Item ID: ${itemId}`);
        console.log(`[BILLING] Service Type: "${serviceType}" (from DB: "${item.service_type}")`);
        console.log(`[BILLING] New Status: "${updateData.approvalStatus}"`);
        console.log(`[BILLING] Previous Status: "${previousStatus}"`);
        
        billingHelper.updateBillingStatus(itemId, serviceType, updateData.approvalStatus, previousStatus, (billingErr, billingResult) => {
          if (billingErr) {
            console.error('[BILLING] ===== ERROR UPDATING BILLING STATUS FOR REPAIR =====');
            console.error('[BILLING] Error details:', billingErr);
          } else if (billingResult) {
            console.log('[BILLING] ===== BILLING UPDATE SUCCESS FOR REPAIR =====');
            console.log('[BILLING] Result:', JSON.stringify(billingResult, null, 2));
          } else {
            console.log('[BILLING] ===== NO BILLING UPDATE NEEDED FOR REPAIR =====');
          }
        });
      }

      // Create notifications for status changes
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        const Notification = require('../model/NotificationModel');
        const customerUserId = item.user_id; // Get customer's user_id from order
        
        if (customerUserId) {
          const serviceType = (item.service_type || 'repair').toLowerCase().trim();
          
          // Create accepted notification
          if (updateData.approvalStatus === 'accepted') {
            Notification.createAcceptedNotification(customerUserId, itemId, serviceType, (notifErr) => {
              if (notifErr) {
                console.error('[NOTIFICATION] Failed to create accepted notification:', notifErr);
              } else {
                console.log('[NOTIFICATION] Accepted notification created successfully');
              }
            });
          }
          
          // Create status update notifications
          const statusNotificationStatuses = [
            'confirmed',
            'in_progress',
            'ready_for_pickup',
            'ready_to_pickup',
            'completed',
            'cancelled'
          ];
          
          if (statusNotificationStatuses.includes(updateData.approvalStatus)) {
            const statusForNotification = 
              updateData.approvalStatus === 'confirmed' ? 'in_progress' :
              updateData.approvalStatus === 'ready_for_pickup' ? 'ready_to_pickup' :
              updateData.approvalStatus === 'ready_to_pickup' ? 'ready_to_pickup' :
              updateData.approvalStatus;
            
            Notification.createStatusUpdateNotification(
              customerUserId,
              itemId,
              statusForNotification,
              null,
              serviceType,
              (notifErr) => {
                if (notifErr) {
                  console.error('[NOTIFICATION] Failed to create status update notification:', notifErr);
                } else {
                  console.log('[NOTIFICATION] Status update notification created successfully');
                }
              }
            );
          }
        } else {
          console.error('[NOTIFICATION] Cannot create notification: customer user_id is missing');
        }
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

      // Update billing status if status changed
      const billingHelper = require('../utils/billingHelper');
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        const serviceType = (item.service_type || 'dry_cleaning').toLowerCase().trim();
        console.log(`[BILLING] ===== STARTING BILLING UPDATE FOR DRY CLEANING =====`);
        console.log(`[BILLING] Item ID: ${itemId}`);
        console.log(`[BILLING] Service Type: "${serviceType}" (from DB: "${item.service_type}")`);
        console.log(`[BILLING] New Status: "${updateData.approvalStatus}"`);
        console.log(`[BILLING] Previous Status: "${previousStatus}"`);
        
        billingHelper.updateBillingStatus(itemId, serviceType, updateData.approvalStatus, previousStatus, (billingErr, billingResult) => {
          if (billingErr) {
            console.error('[BILLING] ===== ERROR UPDATING BILLING STATUS FOR DRY CLEANING =====');
            console.error('[BILLING] Error details:', billingErr);
          } else if (billingResult) {
            console.log('[BILLING] ===== BILLING UPDATE SUCCESS FOR DRY CLEANING =====');
            console.log('[BILLING] Result:', JSON.stringify(billingResult, null, 2));
          } else {
            console.log('[BILLING] ===== NO BILLING UPDATE NEEDED FOR DRY CLEANING =====');
          }
        });
      }

      // Create notifications for status changes
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        const Notification = require('../model/NotificationModel');
        const customerUserId = item.user_id; // Get customer's user_id from order
        
        if (customerUserId) {
          const serviceType = (item.service_type || 'dry_cleaning').toLowerCase().trim();
          
          // Create accepted notification
          if (updateData.approvalStatus === 'accepted') {
            Notification.createAcceptedNotification(customerUserId, itemId, serviceType, (notifErr) => {
              if (notifErr) {
                console.error('[NOTIFICATION] Failed to create accepted notification:', notifErr);
              } else {
                console.log('[NOTIFICATION] Accepted notification created successfully');
              }
            });
          }
          
          // Create status update notifications
          const statusNotificationStatuses = [
            'confirmed',
            'in_progress',
            'ready_for_pickup',
            'ready_to_pickup',
            'completed',
            'cancelled'
          ];
          
          if (statusNotificationStatuses.includes(updateData.approvalStatus)) {
            const statusForNotification = 
              updateData.approvalStatus === 'confirmed' ? 'in_progress' :
              updateData.approvalStatus === 'ready_for_pickup' ? 'ready_to_pickup' :
              updateData.approvalStatus === 'ready_to_pickup' ? 'ready_to_pickup' :
              updateData.approvalStatus;
            
            Notification.createStatusUpdateNotification(
              customerUserId,
              itemId,
              statusForNotification,
              null,
              serviceType,
              (notifErr) => {
                if (notifErr) {
                  console.error('[NOTIFICATION] Failed to create status update notification:', notifErr);
                } else {
                  console.log('[NOTIFICATION] Status update notification created successfully');
                }
              }
            );
          }
        } else {
          console.error('[NOTIFICATION] Cannot create notification: customer user_id is missing');
        }
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

      console.log(`[RENTAL UPDATE] Database update completed for item ${itemId}, affectedRows: ${result?.affectedRows}`);

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

      // Auto-update billing payment_status - MUST happen after database update completes
      const billingHelper = require('../utils/billingHelper');
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        const serviceType = (item.service_type || 'rental').toLowerCase().trim();
        console.log(`[BILLING] ===== STARTING BILLING UPDATE =====`);
        console.log(`[BILLING] Item ID: ${itemId}`);
        console.log(`[BILLING] Service Type: "${serviceType}" (from DB: "${item.service_type}")`);
        console.log(`[BILLING] New Status: "${updateData.approvalStatus}"`);
        console.log(`[BILLING] Previous Status: "${previousStatus}"`);
        console.log(`[BILLING] Status Changed: ${updateData.approvalStatus !== previousStatus}`);
        
        billingHelper.updateBillingStatus(itemId, serviceType, updateData.approvalStatus, previousStatus, (billingErr, billingResult) => {
          if (billingErr) {
            console.error('[BILLING] ===== ERROR UPDATING BILLING STATUS =====');
            console.error('[BILLING] Error details:', billingErr);
            console.error('[BILLING] Error message:', billingErr.message);
            console.error('[BILLING] Error stack:', billingErr.stack);
          } else if (billingResult) {
            console.log('[BILLING] ===== BILLING UPDATE SUCCESS =====');
            console.log('[BILLING] Result:', JSON.stringify(billingResult, null, 2));
          } else {
            console.log('[BILLING] ===== NO BILLING UPDATE NEEDED =====');
            console.log('[BILLING] Status change did not require payment update');
          }
        });
      } else {
        console.log(`[BILLING] ===== SKIPPING BILLING UPDATE =====`);
        console.log(`[BILLING] approvalStatus: ${updateData.approvalStatus}`);
        console.log(`[BILLING] previousStatus: ${previousStatus}`);
        console.log(`[BILLING] statusChanged: ${updateData.approvalStatus && updateData.approvalStatus !== previousStatus}`);
      }

      // If status changed to "rented", update rental_inventory status
      if (updateData.approvalStatus === 'rented' && updateData.approvalStatus !== previousStatus) {
        const RentalInventory = require('../model/RentalInventoryModel');
        const rentalItemId = item.service_id; // service_id is the rental item_id
        
        if (rentalItemId) {
          console.log(`Updating rental_inventory status to 'rented' for item_id: ${rentalItemId}`);
          
          // Update rental inventory status to 'rented'
          const db = require('../config/db');
          const updateSql = `UPDATE rental_inventory SET status = 'rented' WHERE item_id = ?`;
          
          db.query(updateSql, [rentalItemId], (rentalUpdateErr, rentalUpdateResult) => {
            if (rentalUpdateErr) {
              console.error('Error updating rental_inventory status:', rentalUpdateErr);
            } else {
              console.log(`Successfully updated rental_inventory status to 'rented' for item_id: ${rentalItemId}`);
            }
          });
        } else {
          console.warn('Cannot update rental_inventory: service_id is missing from order item');
        }
      }

      // Create notifications for status changes
      if (updateData.approvalStatus && updateData.approvalStatus !== previousStatus) {
        const Notification = require('../model/NotificationModel');
        const customerUserId = item.user_id; // Get customer's user_id from order
        
        if (customerUserId) {
          const serviceType = (item.service_type || 'rental').toLowerCase().trim();
          
          // Create accepted notification
          if (updateData.approvalStatus === 'accepted') {
            Notification.createAcceptedNotification(customerUserId, itemId, serviceType, (notifErr) => {
              if (notifErr) {
                console.error('[NOTIFICATION] Failed to create accepted notification:', notifErr);
              } else {
                console.log('[NOTIFICATION] Accepted notification created successfully');
              }
            });
          }
          
          // Create status update notifications (including rental-specific statuses)
          const statusNotificationStatuses = [
            'confirmed',
            'in_progress',
            'ready_for_pickup',
            'ready_to_pickup',
            'rented',
            'returned',
            'completed',
            'cancelled'
          ];
          
          if (statusNotificationStatuses.includes(updateData.approvalStatus)) {
            const statusForNotification = 
              updateData.approvalStatus === 'confirmed' ? 'in_progress' :
              updateData.approvalStatus === 'ready_for_pickup' ? 'ready_to_pickup' :
              updateData.approvalStatus === 'ready_to_pickup' ? 'ready_to_pickup' :
              updateData.approvalStatus;
            
            Notification.createStatusUpdateNotification(
              customerUserId,
              itemId,
              statusForNotification,
              null,
              serviceType,
              (notifErr) => {
                if (notifErr) {
                  console.error('[NOTIFICATION] Failed to create status update notification:', notifErr);
                } else {
                  console.log('[NOTIFICATION] Status update notification created successfully');
                }
              }
            );
          }
        } else {
          console.error('[NOTIFICATION] Cannot create notification: customer user_id is missing');
        }
      }

      res.json({
        success: true,
        message: "Rental order item updated successfully"
      });
    });
  });
};

// Record payment for rental item (admin only)
exports.recordRentalPayment = (req, res) => {
  const itemId = req.params.id;
  const { paymentAmount } = req.body;

  // Only admins can record payments
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  // Validate payment amount
  const amount = parseFloat(paymentAmount);
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment amount. Amount must be greater than 0."
    });
  }

  // Get current order item
  Order.getOrderItemById(itemId, (getErr, item) => {
    if (getErr || !item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found"
      });
    }

    // Only allow payments for rental items
    if (item.service_type !== 'rental') {
      return res.status(400).json({
        success: false,
        message: "Payment recording is only available for rental items"
      });
    }

    // Get current pricing_factors
    let pricingFactors = {};
    try {
      pricingFactors = item.pricing_factors ? JSON.parse(item.pricing_factors) : {};
    } catch (e) {
      console.error('Error parsing pricing_factors:', e);
    }

    // Get current amount_paid and final_price
    const currentAmountPaid = parseFloat(pricingFactors.amount_paid || 0);
    const finalPrice = parseFloat(item.final_price || 0);
    const newAmountPaid = currentAmountPaid + amount;
    const remainingBalance = finalPrice - newAmountPaid;

    // Check if payment exceeds total price
    if (newAmountPaid > finalPrice) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Total: ₱${finalPrice.toFixed(2)}, Already paid: ₱${currentAmountPaid.toFixed(2)}, Remaining: ₱${(finalPrice - currentAmountPaid).toFixed(2)}`
      });
    }

    // Update pricing_factors with new amount_paid
    pricingFactors.amount_paid = newAmountPaid.toString();
    pricingFactors.remaining_balance = remainingBalance.toString();

    // Update payment_status based on amount paid
    let newPaymentStatus = item.payment_status || 'unpaid';
    if (newAmountPaid >= finalPrice) {
      newPaymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      // For rental, if paid at least 50%, it's down-payment, otherwise partial
      const downpaymentAmount = finalPrice * 0.5;
      if (newAmountPaid >= downpaymentAmount) {
        newPaymentStatus = 'down-payment';
      } else {
        newPaymentStatus = 'partial_payment';
      }
    }

    // Update order item
    const db = require('../config/db');
    const updateSql = `
      UPDATE order_items 
      SET 
        pricing_factors = ?,
        payment_status = ?
      WHERE item_id = ?
    `;

    db.query(updateSql, [JSON.stringify(pricingFactors), newPaymentStatus, itemId], (updateErr, updateResult) => {
      if (updateErr) {
        return res.status(500).json({
          success: false,
          message: "Error recording payment",
          error: updateErr
        });
      }

      // Create action log for dashboard
      const ActionLog = require('../model/ActionLogModel');
      const previousPaymentStatus = item.payment_status || 'unpaid';
      ActionLog.create({
        order_item_id: itemId,
        user_id: item.user_id,
        action_type: 'payment',
        action_by: 'admin',
        previous_status: previousPaymentStatus,
        new_status: newPaymentStatus,
        reason: null,
        notes: `Admin recorded payment of ₱${amount.toFixed(2)}. Total paid: ₱${newAmountPaid.toFixed(2)}. Status: ${previousPaymentStatus} → ${newPaymentStatus}`
      }, (actionLogErr) => {
        if (actionLogErr) {
          console.error('Error creating payment action log:', actionLogErr);
        } else {
          console.log('Payment action log created successfully');
        }
      });

      // Create payment success notification
      if (item.user_id) {
        const Notification = require('../model/NotificationModel');
        const serviceType = (item.service_type || 'rental').toLowerCase().trim();
        Notification.createPaymentSuccessNotification(
          item.user_id,
          itemId,
          amount,
          'cash', // Default to cash for admin-recorded payments
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

      res.json({
        success: true,
        message: "Payment recorded successfully",
        payment: {
          amount_paid: newAmountPaid,
          remaining_balance: Math.max(0, remainingBalance),
          payment_status: newPaymentStatus,
          total_price: finalPrice
        }
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

