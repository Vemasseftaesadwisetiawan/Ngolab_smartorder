import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  db.query("DELETE FROM orders WHERE id LIKE 'ORD-TEST-%'", (err, result) => {
    if (err) {
      console.error('❌ Failed to delete test orders:', err.message);
    } else {
      console.log(`✅ Successfully cleaned up test orders! Rows affected: ${result.affectedRows}`);
    }
    db.end();
  });
});
