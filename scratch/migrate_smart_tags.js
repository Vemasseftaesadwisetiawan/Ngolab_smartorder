import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database.');

  console.log('Modifying label_number column to VARCHAR(100)...');
  db.query("ALTER TABLE `smart_tags` MODIFY COLUMN `label_number` VARCHAR(100) DEFAULT NULL", (err2) => {
    if (err2) {
      console.error('❌ Error modifying column:', err2.message);
      db.end();
      process.exit(1);
    }
    console.log('✅ Column "label_number" changed successfully to VARCHAR(100).');
    db.end();
    process.exit(0);
  });
});
