import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: (process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost'),
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: (process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || 'root'),
    password: (process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''),
    database: (process.env.DB_DATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'smartorder')
  });
  
  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables:', tables);
    
    for (const t of tables) {
      const tableName = Object.values(t)[0];
      if (tableName.includes('menu') || tableName.includes('item')) {
        const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
        console.log(`Rows from ${tableName}:`, rows);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
