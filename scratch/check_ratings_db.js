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
  
  db.query('DESCRIBE ratings', (err, cols) => {
    if (err) return console.error(err);
    console.log('--- COLUMNS ---');
    console.log(cols);
    
    db.query('SELECT * FROM ratings LIMIT 5', (err2, rows) => {
      if (err2) return console.error(err2);
      console.log('--- ROWS ---');
      console.log(rows);
      db.end();
    });
  });
});
