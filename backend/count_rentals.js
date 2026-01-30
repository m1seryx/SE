const db = require('./config/db');

db.query(`
  SELECT 
    item_id, 
    payment_status, 
    final_price,
    JSON_UNQUOTE(JSON_EXTRACT(pricing_factors, '$.amount_paid')) as amount_paid
  FROM order_items 
  WHERE LOWER(service_type) = 'rental'
  ORDER BY item_id
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('=== ALL RENTAL ORDERS IN DATABASE ===\n');
  
  let paidCount = 0;
  let unpaidCount = 0;
  
  rows.forEach((r, i) => {
    const status = r.payment_status || 'empty';
    const isPaid = status !== 'unpaid' && status !== 'pending' && status !== 'cancelled';
    const amountPaid = parseFloat(r.amount_paid || 0);
    
    if (isPaid && amountPaid > 0) {
      paidCount++;
    } else {
      unpaidCount++;
    }
    
    console.log(`${i + 1}. Item #${r.item_id} | Status: ${status.padEnd(10)} | Final: ₱${r.final_price} | Paid: ₱${amountPaid}`);
  });
  
  console.log('\n=== SUMMARY ===');
  console.log('Total rental orders in DB:', rows.length);
  console.log('Paid/Partial (amount_paid > 0):', paidCount);
  console.log('Unpaid/Pending:', unpaidCount);
  
  process.exit(0);
});
