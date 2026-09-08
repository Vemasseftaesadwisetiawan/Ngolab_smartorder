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
    console.error(err);
    process.exit(1);
  }
  
  console.log("--- STRUKTUR TABEL STAFF ---");
  db.query('DESCRIBE staff', (err, results) => {
    if (!err) console.table(results);
    
    console.log("\n--- STRUKTUR TABEL STAFF_SCHEDULES ---");
    db.query('DESCRIBE staff_schedules', (err2, results2) => {
      if (!err2) console.table(results2);
      db.end();
    });
  });
});
