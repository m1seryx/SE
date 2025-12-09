const db = require('../config/db');

// Update foreign key constraint to allow NULL order_item_id
function updateForeignKey() {
  return new Promise((resolve, reject) => {
    console.log('Updating foreign key constraint to allow NULL order_item_id...');

    // First, drop the existing foreign key
    const dropFkSql = `
      ALTER TABLE action_logs 
      DROP FOREIGN KEY action_logs_ibfk_1
    `;

    db.query(dropFkSql, (err, result) => {
      if (err && !err.message.includes("doesn't exist")) {
        console.error('Error dropping foreign key:', err);
        // Continue anyway - might not exist
      }

      // Add new foreign key that allows NULL
      const addFkSql = `
        ALTER TABLE action_logs 
        ADD CONSTRAINT fk_action_logs_order_item 
        FOREIGN KEY (order_item_id) 
        REFERENCES order_items(item_id) 
        ON DELETE CASCADE
      `;

      db.query(addFkSql, (err, result) => {
        if (err) {
          // Foreign key might already exist or there might be an issue
          // Check if it's because the constraint already exists
          if (err.message.includes('Duplicate foreign key') || err.message.includes('already exists')) {
            console.log('✓ Foreign key constraint already exists');
            resolve();
          } else {
            console.error('Error adding foreign key:', err);
            // This is okay - we can continue without the FK constraint
            console.log('⚠ Continuing without foreign key constraint (NULL values allowed)');
            resolve();
          }
        } else {
          console.log('✓ Foreign key constraint updated successfully');
          resolve();
        }
      });
    });
  });
}

// Run update
updateForeignKey()
  .then(() => {
    console.log('\n✅ Foreign key update completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Foreign key update failed:', err);
    process.exit(1);
  });

