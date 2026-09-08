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
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database.');

  // Check if column already exists
  db.query("SHOW COLUMNS FROM `stock_items` LIKE 'expiry_date'", (err, results) => {
    if (err) {
      console.error('❌ Error checking columns:', err.message);
      db.end();
      process.exit(1);
    }

    if (results.length > 0) {
      console.log('ℹ️ Column "expiry_date" already exists in "stock_items".');
      db.end();
      process.exit(0);
    } else {
      console.log('Adding column "expiry_date" to "stock_items" table...');
      db.query("ALTER TABLE `stock_items` ADD COLUMN `expiry_date` DATE DEFAULT NULL", (err2) => {
        if (err2) {
          console.error('❌ Error adding column:', err2.message);
          db.end();
          process.exit(1);
        }
        console.log('✅ Column "expiry_date" added successfully.');
        
        // Let's also update some mock data to have expiry dates
        console.log('Setting some sample expiration dates...');
        const today = new Date();
        const dateString = (daysOffset) => {
          const d = new Date();
          d.setDate(today.getDate() + daysOffset);
          return d.toISOString().split('T')[0];
        };

        // Update some mock stock items
        // Let's set beras to expire in 30 days, susu in 2 days (hampir kadaluarsa), kopi bubuk to expire in 60 days
        db.query("UPDATE `stock_items` SET `expiry_date` = ? WHERE `name` = 'Beras'", [dateString(30)], () => {
          db.query("UPDATE `stock_items` SET `expiry_date` = ? WHERE `name` = 'Susu'", [dateString(2)], () => {
            db.query("UPDATE `stock_items` SET `expiry_date` = ? WHERE `name` = 'Gula'", [dateString(-1)], () => {
              console.log('✅ Updated sample mock data with expiration dates.');
              db.end();
              process.exit(0);
            });
          });
        });
      });
    }
  });
});
