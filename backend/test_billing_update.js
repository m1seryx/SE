const db = require('./config/db');
const billingHelper = require('./utils/billingHelper');

// Test the billing update function
const testItemId = process.argv[2];

if (!testItemId) {
  console.log('Usage: node test_billing_update.js <item_id>');
  console.log('Or run without args to see recent rental items');
  
  // Show recent rental items
  db.query(`
    SELECT item_id, service_type, approval_status, payment_status, final_price 
    FROM order_items 
    WHERE service_type = 'rental' 
    ORDER BY item_id DESC 
    LIMIT 10
  `, (err, results) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\nRecent rental items:');
      console.table(results);
    }
    process.exit(0);
  });
} else {
  // Test billing update for specific item
  db.query(`
    SELECT item_id, service_type, approval_status, payment_status, final_price 
    FROM order_items 
    WHERE item_id = ?
  `, [testItemId], (err, results) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    
    if (!results || results.length === 0) {
      console.log('Item not found');
      process.exit(1);
    }
    
    const item = results[0];
    console.log('\nCurrent item state:');
    console.table([item]);
    
    console.log('\nTesting billing update...');
    billingHelper.updateBillingStatus(
      item.item_id,
      item.service_type,
      item.approval_status,
      'pending', // previous status
      (billingErr, billingResult) => {
        if (billingErr) {
          console.error('Error:', billingErr);
        } else if (billingResult) {
          console.log('Success:', billingResult);
        } else {
          console.log('No update needed');
        }
        
        // Check updated status
        db.query(`
          SELECT item_id, service_type, approval_status, payment_status 
          FROM order_items 
          WHERE item_id = ?
        `, [testItemId], (checkErr, checkResults) => {
          if (checkErr) {
            console.error('Error checking:', checkErr);
          } else {
            console.log('\nUpdated item state:');
            console.table(checkResults);
          }
          process.exit(0);
        });
      }
    );
  });
}

