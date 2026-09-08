import mysql from 'mysql2';

const db = mysql.createConnection({
  host: (process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost'),
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  user: (process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || 'root'),
  password: (process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''),
  database: (process.env.DB_DATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'smartorder_db')
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
