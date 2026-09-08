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
  
  db.query('SHOW TABLES LIKE "users"', (err, tables) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
      db.end();
      process.exit(1);
    }
    
    if (tables.length === 0) {
      console.log('⚠️ Table "users" DOES NOT EXIST.');
      db.end();
      return;
    }
    
    db.query('DESCRIBE users', (err, columns) => {
      if (err) {
        console.error('❌ DESCRIBE users failed:', err.message);
      } else {
        console.log('✅ "users" table columns:');
        console.log(JSON.stringify(columns, null, 2));
      }
      db.end();
    });
  });
});
