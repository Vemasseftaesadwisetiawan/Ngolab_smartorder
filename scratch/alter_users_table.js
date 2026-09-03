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
  
  const alterQuery = `
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('Admin', 'Manager', 'Owner', 'Staff Operasional', 'Staff Dapur', 'user') NOT NULL
  `;
  
  db.query(alterQuery, (err, result) => {
    if (err) {
      console.error('❌ Failed to update users table role column:', err.message);
    } else {
      console.log('✅ Successfully updated the "role" column in the "users" table to support "user" registration!');
    }
    db.end();
  });
});
