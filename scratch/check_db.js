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
    console.error('❌ Gagal koneksi database:', err.message);
    process.exit(1);
  }
  
  // 1. Show Tables
  db.query('SHOW TABLES', (err, tables) => {
    if (err) return console.error(err);
    console.log('--- TABLES ---');
    console.log(tables);
    
    // 2. Describe users
    db.query('DESCRIBE users', (err, cols) => {
      if (err) return console.error(err);
      console.log('--- USERS COLUMNS ---');
      console.log(cols);
      
      // 3. Select * from users
      db.query('SELECT id, name, email, role, status FROM users', (err, users) => {
        if (err) return console.error(err);
        console.log('--- USERS RECORDS ---');
        console.log(users);
        db.end();
      });
    });
  });
});
