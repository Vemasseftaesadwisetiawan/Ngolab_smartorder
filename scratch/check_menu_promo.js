import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
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
