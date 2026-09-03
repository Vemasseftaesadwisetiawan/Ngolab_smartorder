import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
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
