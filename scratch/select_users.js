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

  db.query('SELECT id, name, points FROM users LIMIT 5', (err, results) => {
    if (err) {
      console.error('❌ Gagal SELECT users:', err.message);
    } else {
      console.log('✅ Users found:', results);
    }
    db.end();
  });
});
