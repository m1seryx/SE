# Walk-In Orders Migration Instructions

## ⚠️ IMPORTANT: You MUST run the database migration before using walk-in orders!

The walk-in orders feature requires new database tables and columns that don't exist in your current database.

## How to Run the Migration

### Option 1: Using MySQL Command Line
```bash
mysql -u your_username -p your_database_name < backend/database/walk_in_orders_migration.sql
```

### Option 2: Using MySQL Workbench or phpMyAdmin
1. Open MySQL Workbench or phpMyAdmin
2. Connect to your database
3. Open the file: `backend/database/walk_in_orders_migration.sql`
4. Execute the entire script

### Option 3: Using Node.js (if you have a migration runner)
```javascript
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database_name',
  multipleStatements: true
});

const sql = fs.readFileSync(path.join(__dirname, 'database/walk_in_orders_migration.sql'), 'utf8');

connection.query(sql, (err) => {
  if (err) {
    console.error('Migration failed:', err);
  } else {
    console.log('Migration completed successfully!');
  }
  connection.end();
});
```

## What the Migration Does

1. **Creates `walk_in_customers` table** - Stores walk-in customer information
2. **Adds `order_type` column to `orders` table** - Distinguishes between 'online' and 'walk_in' orders
3. **Adds `walk_in_customer_id` column to `orders` table** - Links orders to walk-in customers
4. **Updates `rental_inventory` table** - Adds `rented_by_customer_id` and `rented_date` columns
5. **Creates `damage_records` table** - Tracks damage to rental items

## Verification

After running the migration, verify it worked by checking:

```sql
-- Check if walk_in_customers table exists
SHOW TABLES LIKE 'walk_in_customers';

-- Check if orders table has the new columns
DESCRIBE orders;
-- Should show: order_type, walk_in_customer_id

-- Check if rental_inventory has new columns
DESCRIBE rental_inventory;
-- Should show: rented_by_customer_id, rented_date
```

## Troubleshooting

If you get errors:
- **"Table already exists"** - Some parts may have already been migrated, that's okay
- **"Column already exists"** - The migration uses IF NOT EXISTS, so it's safe to run multiple times
- **Foreign key errors** - Make sure the `user` table exists (for foreign key references)

## After Migration

Once the migration is complete, restart your backend server and try creating a walk-in order again.

