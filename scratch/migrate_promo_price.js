import mysql from 'mysql2';

const db = mysql.createConnection({
  host: (process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost'),
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  user: (process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || 'root'),
  password: (process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''),
  database: (process.env.DB_DATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'smartorder_db')
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
