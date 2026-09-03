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
  
  db.query('SELECT * FROM menu_items WHERE name = "Kopi Caramel"', (err, results) => {
    if (err) {
      console.error(err);
    } else {
      console.log('--- KOPI CARAMEL ---');
      console.log(results);
    }
    db.end();
  });
});
