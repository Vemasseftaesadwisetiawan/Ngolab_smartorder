import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting:', err);
    process.exit(1);
  }
  db.query('SELECT * FROM smart_tags', (err, results) => {
    if (err) {
      console.error('Error querying:', err);
    } else {
      console.log('--- DB Results ---');
      console.log(JSON.stringify(results, null, 2));
    }
    db.end();
  });
});
