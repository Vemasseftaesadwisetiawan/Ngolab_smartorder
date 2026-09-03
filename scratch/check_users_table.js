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
  
  db.query('SHOW TABLES LIKE "users"', (err, tables) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
      db.end();
      process.exit(1);
    }
    
    if (tables.length === 0) {
      console.log('⚠️ Table "users" DOES NOT EXIST.');
      db.end();
      return;
    }
    
    db.query('DESCRIBE users', (err, columns) => {
      if (err) {
        console.error('❌ DESCRIBE users failed:', err.message);
      } else {
        console.log('✅ "users" table columns:');
        console.log(JSON.stringify(columns, null, 2));
      }
      db.end();
    });
  });
});
