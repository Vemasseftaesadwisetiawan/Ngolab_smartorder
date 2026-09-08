import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: (process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost'),
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: (process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || 'root'),
    password: (process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '')
  });
  
  try {
    const [rows] = await connection.query('SHOW DATABASES');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
