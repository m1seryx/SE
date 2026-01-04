const db = require('./config/db');

async function addMissingGarments() {
  try {
    const [result] = await db.promise().query(`
      INSERT INTO garment_types (garment_name, garment_price, garment_code, description, is_active) VALUES 
      ('Suit', '3500.00', 'suit-1', 'Formal suit', 1), 
      ('Barong', '2500.00', 'barong', 'Traditional Filipino formal wear', 1)
    `);
    console.log('Inserted', result.affectedRows, 'rows');
    
    // Verify
    const [rows] = await db.promise().query('SELECT * FROM garment_types');
    console.log('\nAll garment types:');
    rows.forEach(r => console.log(`- ${r.garment_name} (code: ${r.garment_code})`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addMissingGarments();
