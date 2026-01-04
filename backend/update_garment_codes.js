const db = require('./config/db');

async function updateGarmentCodes() {
  try {
    // Update Pants
    const [r1] = await db.promise().query(
      "UPDATE garment_types SET garment_code = 'pants' WHERE garment_name = 'Pants' AND (garment_code IS NULL OR garment_code = '')"
    );
    console.log('Updated Pants:', r1.affectedRows);

    // Update Blazer to use coat-men (matches 3D customizer)
    const [r2] = await db.promise().query(
      "UPDATE garment_types SET garment_code = 'coat-men' WHERE garment_name = 'Blazer'"
    );
    console.log('Updated Blazer:', r2.affectedRows);

    // Update Suit to use suit-1 (matches 3D customizer)
    const [r3] = await db.promise().query(
      "UPDATE garment_types SET garment_code = 'suit-1' WHERE garment_name = 'Suit'"
    );
    console.log('Updated Suit:', r3.affectedRows);

    // Verify
    const [rows] = await db.promise().query('SELECT garment_name, garment_code FROM garment_types');
    console.log('\nUpdated garment codes:');
    rows.forEach(r => console.log(`- ${r.garment_name}: ${r.garment_code}`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateGarmentCodes();
