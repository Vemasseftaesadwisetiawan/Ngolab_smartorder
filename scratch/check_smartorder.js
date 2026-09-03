import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'smartorder'
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
