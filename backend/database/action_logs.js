const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Check if table exists
function tableExists(tableName, callback) {
  const sql = `
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = ?
  `;
  db.query(sql, [tableName], (err, results) => {
    if (err) return callback(err, false);
    callback(null, results[0].count > 0);
  });
}

// Execute migration
async function runMigration() {
  return new Promise((resolve, reject) => {
    console.log('Starting action logs migration...');

    // Check if table already exists
    tableExists('action_logs', (err, exists) => {
      if (err) {
        console.error('Error checking if action_logs table exists:', err);
        return reject(err);
      }

      if (exists) {
        console.log('✓ action_logs table already exists. Skipping migration.');
        resolve();
        return;
      }

      // Read SQL file
      const sqlFilePath = path.join(__dirname, 'action_logs.sql');
      const schemaSql = fs.readFileSync(sqlFilePath, 'utf8');

      // Execute the SQL
      db.query(schemaSql, (err, result) => {
        if (err) {
          console.error('❌ Error creating action_logs table:', err);
          return reject(err);
        }

        console.log('✓ action_logs table created successfully!');
        resolve();
      });
    });
  });
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  });

