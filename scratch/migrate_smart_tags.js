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

  console.log('Modifying label_number column to VARCHAR(100)...');
  db.query("ALTER TABLE `smart_tags` MODIFY COLUMN `label_number` VARCHAR(100) DEFAULT NULL", (err2) => {
    if (err2) {
      console.error('❌ Error modifying column:', err2.message);
      db.end();
      process.exit(1);
    }
    console.log('✅ Column "label_number" changed successfully to VARCHAR(100).');
    db.end();
    process.exit(0);
  });
});
