import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database.');

  console.log('Adding column "promo_price" to "menu_items" table...');
  db.query('ALTER TABLE `menu_items` ADD COLUMN `promo_price` INT DEFAULT NULL', (err2) => {
    if (err2) {
      if (err2.code === 'ER_DUP_COLUMN_NAME') {
        console.log('ℹ️ Column "promo_price" already exists.');
        db.end();
        process.exit(0);
      }
      console.error('❌ Error altering table:', err2.message);
      db.end();
      process.exit(1);
    }
    console.log('✅ Column "promo_price" added successfully to "menu_items" table.');
    db.end();
    process.exit(0);
  });
});
