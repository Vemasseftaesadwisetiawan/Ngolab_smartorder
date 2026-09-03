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

  db.query('DESCRIBE users', (err, results) => {
    if (err) {
      console.error('❌ Gagal query DESCRIBE users:', err.message);
    } else {
      console.log('✅ Columns in users table:', results);
    }
    db.end();
  });
});
