const db = require('./config/db');

const query = `
  SELECT 
    oi.item_id, 
    oi.service_type, 
    oi.final_price, 
    oi.payment_status, 
    oi.pricing_factors
  FROM order_items oi 
  WHERE LOWER(oi.service_type) = 'rental'
  ORDER BY oi.item_id
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('Error:', err);
    db.end();
    return;
  }

  console.log('=== ALL RENTAL ORDERS ===\n');
  
  let totalAmountPaid = 0;
  let totalDownPayment = 0;
  let includedCount = 0;
  let excludedCount = 0;

  results.forEach(r => {
    let pricingFactors = {};
    try {
      pricingFactors = r.pricing_factors ? JSON.parse(r.pricing_factors) : {};
    } catch (e) {
      pricingFactors = {};
    }

    const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
    const downpayment = parseFloat(pricingFactors.downpayment || pricingFactors.down_payment || 0);
    const isIncluded = !['unpaid', 'pending', 'cancelled'].includes(r.payment_status);

    console.log(`Item #${r.item_id}:`);
    console.log(`  final_price: ₱${parseFloat(r.final_price).toLocaleString()}`);
    console.log(`  payment_status: ${r.payment_status}`);
    console.log(`  amount_paid: ₱${amountPaid.toLocaleString()}`);
    console.log(`  downpayment: ₱${downpayment.toLocaleString()}`);
    console.log(`  included in analytics: ${isIncluded ? 'YES' : 'NO'}`);
    console.log('');

    if (isIncluded) {
      totalAmountPaid += amountPaid;
      totalDownPayment += downpayment;
      includedCount++;
    } else {
      excludedCount++;
    }
  });

  console.log('=== SUMMARY ===');
  console.log(`Total rental orders: ${results.length}`);
  console.log(`Included in analytics: ${includedCount}`);
  console.log(`Excluded (unpaid/pending/cancelled): ${excludedCount}`);
  console.log('');
  console.log(`Total amount_paid (from pricing_factors): ₱${totalAmountPaid.toLocaleString()}`);
  console.log(`Total downpayment (from pricing_factors): ₱${totalDownPayment.toLocaleString()}`);
  
  db.end();
});
