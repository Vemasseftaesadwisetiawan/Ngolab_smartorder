import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });
  
  try {
    const [dbs] = await connection.query('SHOW DATABASES');
    for (const dbRow of dbs) {
      const dbName = dbRow.Database;
      if (['information_schema', 'performance_schema', 'mysql', 'sys', 'phpmyadmin'].includes(dbName)) continue;
      
      await connection.query(`USE \`${dbName}\``);
      const [tables] = await connection.query('SHOW TABLES');
      
      for (const t of tables) {
        const tableName = Object.values(t)[0];
        try {
          // Check columns
          const [cols] = await connection.query(`DESCRIBE \`${tableName}\``);
          const colNames = cols.map(c => c.Field);
          
          // Search for "coworking" in any text/varchar columns
          for (const col of colNames) {
            const [rows] = await connection.query(
              `SELECT * FROM \`${tableName}\` WHERE \`${col}\` LIKE '%coworking%'`
            );
            if (rows.length > 0) {
              console.log(`Found in Database: ${dbName}, Table: ${tableName}, Column: ${col}`);
              console.log(rows);
            }
          }
        } catch (tableErr) {
          // Skip views or table errors
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
