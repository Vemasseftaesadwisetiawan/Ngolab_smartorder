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
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  // 1. Cek apakah kolom user_id sudah ada
  db.query('SHOW COLUMNS FROM orders LIKE "user_id"', (err, cols) => {
    if (err) {
      console.error('❌ SHOW COLUMNS failed:', err.message);
      db.end();
      process.exit(1);
    }

    if (cols.length > 0) {
      console.log('✅ Column "user_id" already exists in "orders" table. No need to migrate.');
      db.end();
      return;
    }

    // 2. Tambahkan kolom user_id dan foreign key
    const alterQuery = `
      ALTER TABLE orders 
      ADD COLUMN user_id INT NULL,
      ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    `;

    db.query(alterQuery, (err, result) => {
      if (err) {
        console.error('❌ ALTER TABLE orders failed:', err.message);
      } else {
        console.log('✅ Column "user_id" (with FOREIGN KEY to users) successfully added to "orders" table!');
      }
      db.end();
    });
  });
});
