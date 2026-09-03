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
  
  db.query('DESCRIBE orders', (err, columns) => {
    if (err) {
      console.error('❌ DESCRIBE orders failed:', err.message);
    } else {
      console.log('✅ "orders" table columns:');
      console.log(JSON.stringify(columns, null, 2));
    }
    db.end();
  });
});
