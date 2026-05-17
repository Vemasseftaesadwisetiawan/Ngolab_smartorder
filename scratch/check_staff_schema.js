import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
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
