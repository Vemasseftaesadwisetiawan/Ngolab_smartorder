import mysql from 'mysql2/promise';

async function fix() {
  const connection = await mysql.createConnection({
    host: (process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost'),
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: (process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || 'root'),
    password: (process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''),
    database: (process.env.DB_DATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'smartorder_db')
  });

  try {
    console.log('🔄 Menyesuaikan role di database...');

    await connection.query(`
      UPDATE users
      SET role = CASE
        WHEN email = 'kasir@smartorder.com' THEN 'kasir'
        WHEN email = 'koki@smartorder.com' THEN 'koki'
      END
      WHERE email IN ('kasir@smartorder.com', 'koki@smartorder.com')
    `);

    console.log('✅ Role database disesuaikan:');
    console.log('   👤 Kasir  | kasir@smartorder.com | kasir123 | role DB: kasir');
    console.log('   👤 Koki   | koki@smartorder.com  | koki123  | role DB: koki');
  } catch (err) {
    console.error('❌ Gagal memperbarui role:', err.message);
  } finally {
    await connection.end();
  }
}

fix();
