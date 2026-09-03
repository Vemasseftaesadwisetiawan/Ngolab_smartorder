import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
});

db.connect((err) => {
  if (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
  
  db.query('SELECT id, name, category, price, status, displayed FROM menu_items', (err, results) => {
    if (err) {
      console.error('Query failed:', err.message);
      db.end();
      process.exit(1);
    }
    
    console.log(JSON.stringify(results, null, 2));
    db.end();
  });
});
