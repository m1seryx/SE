const db = require('../config/db');
const TransactionLog = require('../model/TransactionLogModel');

/**
 * Automatically update billing payment_status based on service status
 * @param {number} itemId - Order item ID
 * @param {string} serviceType - Service type (rental, repair, dry_cleaning, customization)
 * @param {string} newStatus - New approval status
 * @param {string} previousStatus - Previous approval status
 * @param {function} callback - Callback function
 */
exports.updateBillingStatus = (itemId, serviceType, newStatus, previousStatus, callback) => {
  console.log(`[BILLING HELPER] Called with: itemId=${itemId}, serviceType=${serviceType}, newStatus=${newStatus}, previousStatus=${previousStatus}`);
  
  // Only update if status actually changed
  if (newStatus === previousStatus) {
    console.log(`[BILLING HELPER] Status unchanged, skipping update`);
    return callback(null, null);
  }

  let newPaymentStatus = null;
  let transactionType = 'payment';
  let amount = 0;

  // Normalize service type for comparison
  const normalizedServiceType = (serviceType || '').toLowerCase().trim();

  // Rental service logic
  if (normalizedServiceType === 'rental') {
    console.log(`[BILLING HELPER] Processing rental service`);
    if (newStatus === 'rented') {
      newPaymentStatus = 'down-payment';
      transactionType = 'down_payment';
      console.log(`[BILLING HELPER] Rental status 'rented' detected, setting payment_status to 'down-payment'`);
    } else if (newStatus === 'returned' || newStatus === 'completed') {
      newPaymentStatus = 'fully_paid';
      transactionType = 'final_payment';
      console.log(`[BILLING HELPER] Rental status '${newStatus}' detected, setting payment_status to 'fully_paid'`);
    }
  }
  // Other services (dry_cleaning, repair, customization)
  else if (['dry_cleaning', 'dry-cleaning', 'drycleaning', 'repair', 'customization', 'customize'].includes(normalizedServiceType)) {
    console.log(`[BILLING HELPER] Processing ${normalizedServiceType} service`);
    if (newStatus === 'completed') {
      newPaymentStatus = 'paid';
      transactionType = 'payment';
      console.log(`[BILLING HELPER] Status 'completed' detected, setting payment_status to 'paid'`);
    }
  } else {
    console.log(`[BILLING HELPER] Unknown service type: ${normalizedServiceType}, skipping billing update`);
  }

  // If no payment status change needed, return early
  if (!newPaymentStatus) {
    console.log(`[BILLING HELPER] No payment status change needed for status: ${newStatus}`);
    return callback(null, null);
  }

  // Get order item details to get user_id and final_price
  // user_id is in the orders table, not order_items, so we need to join
  const getItemSql = `
    SELECT 
      oi.item_id,
      oi.final_price, 
      oi.payment_status, 
      oi.order_id,
      o.user_id
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.item_id = ?
  `;
  
  db.query(getItemSql, [itemId], (getErr, items) => {
    if (getErr || !items || items.length === 0) {
      console.error('[BILLING HELPER] Error fetching order item for billing update:', getErr);
      return callback(getErr || new Error('Order item not found'), null);
    }

    const item = items[0];
    const previousPaymentStatus = item.payment_status || 'unpaid';
    console.log(`[BILLING HELPER] Found order item: item_id=${item.item_id}, user_id=${item.user_id}, final_price=${item.final_price}, current_payment_status=${previousPaymentStatus}`);
    
    // Calculate amount based on transaction type
    const normalizedServiceTypeForAmount = (serviceType || '').toLowerCase().trim();
    if (normalizedServiceTypeForAmount === 'rental' && newStatus === 'rented') {
      // For rental down-payment, get 50% of final_price
      amount = parseFloat(item.final_price) * 0.5;
      console.log(`[BILLING HELPER] Calculated downpayment amount: ${amount} (50% of ${item.final_price})`);
    } else if (normalizedServiceTypeForAmount === 'rental' && (newStatus === 'returned' || newStatus === 'completed')) {
      // For rental final payment (returned or completed), get remaining 50%
      // Check if down-payment was already made
      if (previousPaymentStatus === 'down-payment') {
        amount = parseFloat(item.final_price) * 0.5;
        console.log(`[BILLING HELPER] Calculated final payment amount: ${amount} (remaining 50% of ${item.final_price})`);
      } else {
        // If no down-payment was made, charge full amount
        amount = parseFloat(item.final_price) || 0;
        console.log(`[BILLING HELPER] Calculated full payment amount: ${amount} (no previous down-payment)`);
      }
    } else {
      // For other services, full amount
      amount = parseFloat(item.final_price) || 0;
      console.log(`[BILLING HELPER] Calculated payment amount: ${amount} (full price)`);
    }

    // Update payment_status in order_items table
    const updateSql = `UPDATE order_items SET payment_status = ? WHERE item_id = ?`;
    console.log(`[BILLING HELPER] Executing SQL: ${updateSql}`);
    console.log(`[BILLING HELPER] Parameters: payment_status="${newPaymentStatus}", item_id=${itemId}`);
    
    db.query(updateSql, [newPaymentStatus, itemId], (err, result) => {
      if (err) {
        console.error('[BILLING HELPER] ===== SQL ERROR =====');
        console.error('[BILLING HELPER] Error updating billing payment_status:', err);
        console.error('[BILLING HELPER] SQL:', updateSql);
        console.error('[BILLING HELPER] Parameters:', [newPaymentStatus, itemId]);
        return callback(err, null);
      }
      
      console.log(`[BILLING HELPER] ===== SQL UPDATE SUCCESS =====`);
      console.log(`[BILLING HELPER] Item ${itemId} payment_status updated: ${previousPaymentStatus} → ${newPaymentStatus}`);
      console.log(`[BILLING HELPER] Affected rows: ${result.affectedRows}`);
      console.log(`[BILLING HELPER] Service: ${serviceType}, Status: ${newStatus}`);
      
      // Verify the update by querying the database
      db.query(`SELECT item_id, payment_status FROM order_items WHERE item_id = ?`, [itemId], (verifyErr, verifyResults) => {
        if (verifyErr) {
          console.error('[BILLING HELPER] Error verifying update:', verifyErr);
        } else if (verifyResults && verifyResults.length > 0) {
          console.log(`[BILLING HELPER] Verification: Current payment_status in DB = "${verifyResults[0].payment_status}"`);
          if (verifyResults[0].payment_status !== newPaymentStatus) {
            console.error(`[BILLING HELPER] WARNING: Payment status mismatch! Expected "${newPaymentStatus}" but got "${verifyResults[0].payment_status}"`);
          }
        }
      });
      
      // Create transaction log entry
      TransactionLog.create({
        order_item_id: itemId,
        user_id: item.user_id,
        transaction_type: transactionType,
        amount: amount,
        previous_payment_status: previousPaymentStatus,
        new_payment_status: newPaymentStatus,
        payment_method: 'system_auto',
        notes: `Auto-updated from status change: ${previousStatus} → ${newStatus} (${serviceType})`,
        created_by: 'system'
      }, (logErr, logResult) => {
        if (logErr) {
          console.error('Error creating transaction log:', logErr);
          // Don't fail the whole operation if log creation fails
        } else {
          console.log('Transaction log created:', logResult?.insertId);
        }
      });
      
      callback(null, { 
        payment_status: newPaymentStatus, 
        affectedRows: result.affectedRows,
        amount: amount,
        transaction_type: transactionType
      });
    });
  });
};

