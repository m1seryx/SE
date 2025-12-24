const db = require('./config/db');

async function testPenalty() {
  console.log('=== RENTAL PENALTY TEST ===\n');
  
  // Step 1: Find a rental to test with
  const findQuery = `
    SELECT item_id, order_id, service_type, final_price, approval_status, 
           rental_start_date, rental_end_date, pricing_factors
    FROM order_items 
    WHERE service_type = 'rental' 
      AND approval_status IN ('rented', 'picked_up', 'ready_to_pickup')
    ORDER BY item_id DESC 
    LIMIT 5
  `;
  
  db.query(findQuery, (err, results) => {
    if (err) {
      console.log('Error:', err);
      process.exit(1);
    }
    
    console.log('Step 1: Available rental items for testing:');
    if (results.length > 0) {
      results.forEach(r => {
        console.log(`  - Item ${r.item_id}: Status=${r.approval_status}, End=${r.rental_end_date}, Price=${r.final_price}`);
      });
      
      // Pick the first one and set its end date to 3 days ago
      const testItem = results[0];
      console.log(`\nStep 2: Setting item ${testItem.item_id} end date to 3 days ago...`);
      
      const updateEndDate = `
        UPDATE order_items 
        SET rental_end_date = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        WHERE item_id = ?
      `;
      
      db.query(updateEndDate, [testItem.item_id], (err2) => {
        if (err2) {
          console.log('Error updating end date:', err2);
          process.exit(1);
        }
        
        console.log(`✅ End date updated. Now mark item ${testItem.item_id} as 'returned' in the admin panel.`);
        console.log('\nStep 3: Watch the backend console for these logs:');
        console.log('  [RENTAL PENALTY] Item X: End date: ..., Days exceeded: 3, Penalty: ₱300');
        console.log('  [RENTAL PENALTY] Original price: ₱X, Penalty: ₱300, New final price: ₱X+300');
        
        process.exit(0);
      });
    } else {
      console.log('  No rentals in testable status found.');
      console.log('\nChecking returned items we can reset...');
      
      const returnedQuery = `
        SELECT item_id, order_id, final_price, approval_status, 
               rental_end_date, JSON_EXTRACT(pricing_factors, '$.penalty') as existing_penalty
        FROM order_items 
        WHERE service_type = 'rental' 
          AND approval_status = 'returned'
        ORDER BY item_id DESC 
        LIMIT 5
      `;
      
      db.query(returnedQuery, (err3, returned) => {
        if (returned && returned.length > 0) {
          console.log('\nReturned rentals (can reset for testing):');
          returned.forEach(r => {
            console.log(`  - Item ${r.item_id}: Price=${r.final_price}, End=${r.rental_end_date}, Penalty=${r.existing_penalty || 'none'}`);
          });
          
          // Reset the first one for testing
          const resetItem = returned[0];
          console.log(`\nStep 2: Resetting item ${resetItem.item_id} to 'rented' status with past end date...`);
          
          const resetQuery = `
            UPDATE order_items 
            SET approval_status = 'rented',
                rental_end_date = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
            WHERE item_id = ?
          `;
          
          db.query(resetQuery, [resetItem.item_id], (err4) => {
            if (err4) {
              console.log('Error resetting:', err4);
              process.exit(1);
            }
            
            console.log(`✅ Item ${resetItem.item_id} reset to 'rented' with end date 3 days ago.`);
            console.log('\nStep 3: Now go to Admin Panel → Rental Management');
            console.log(`         Find item ${resetItem.item_id} and change status to "Returned"`);
            console.log('\nStep 4: Watch the backend console for penalty logs:');
            console.log('  [RENTAL PENALTY] Item X: End date: ..., Days exceeded: 3, Penalty: ₱300');
            
            process.exit(0);
          });
        } else {
          console.log('No rental items found for testing.');
          process.exit(0);
        }
      });
    }
  });
}

testPenalty();
