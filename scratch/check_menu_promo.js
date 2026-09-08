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
  db.query('DESCRIBE menu_items', (err2, cols) => {
    if (err2) {
      console.error('❌ DESCRIBE error:', err2.message);
      db.end();
      process.exit(1);
    }
    console.log('Columns in menu_items:');
    cols.forEach(c => {
      console.log(`- ${c.Field}: ${c.Type}`);
    });
    db.end();
  });
});
