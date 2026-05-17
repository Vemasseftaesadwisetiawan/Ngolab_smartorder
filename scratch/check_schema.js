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
  db.query('DESCRIBE ratings', (err, results) => {
    if (err) {
      console.error(err);
    } else {
      console.table(results);
    }
    db.end();
  });
});
