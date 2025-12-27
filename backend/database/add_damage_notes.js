// Add damage_notes column to rental_inventory table
// Run this script to add the damage_notes column

const db = require('../config/db');

const addDamageNotesColumn = () => {
  const sql = `
    ALTER TABLE rental_inventory
    ADD COLUMN IF NOT EXISTS damage_notes TEXT DEFAULT NULL AFTER care_instructions
  `;
  
  db.query(sql, (err, result) => {
    if (err) {
      // Check if column already exists (MySQL specific error code)
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column damage_notes already exists in rental_inventory table');
      } else {
        console.error('Error adding damage_notes column:', err);
      }
    } else {
      console.log('Successfully added damage_notes column to rental_inventory table');
    }
    
    // Close the database connection
    db.end((endErr) => {
      if (endErr) {
        console.error('Error closing database connection:', endErr);
      }
      process.exit(err && err.code !== 'ER_DUP_FIELDNAME' ? 1 : 0);
    });
  });
};

// Check if running directly
if (require.main === module) {
  addDamageNotesColumn();
}

module.exports = addDamageNotesColumn;
