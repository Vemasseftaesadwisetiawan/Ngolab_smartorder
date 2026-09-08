import mysql from 'mysql2/promise';

async function migrate() {
  const connection = await mysql.createConnection({
    host: (process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost'),
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: (process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || 'root'),
    password: (process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''),
    database: (process.env.DB_DATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'smartorder_db')
  });

  try {
    console.log('🔄 Menambahkan kolom ketersediaan menu...');

    await connection.query(`
      ALTER TABLE menu_items
      ADD COLUMN availability_type ENUM('permanent','scheduled') DEFAULT 'permanent' AFTER promo_price,
      ADD COLUMN available_from DATE DEFAULT NULL AFTER availability_type,
      ADD COLUMN available_to DATE DEFAULT NULL AFTER available_from
    `);

    console.log('✅ Kolom berhasil ditambahkan!');
    console.log('   - availability_type');
    console.log('   - available_from');
    console.log('   - available_to');
    console.log('📋 Semua data lama otomatis di-set ke permanent.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Kolom sudah ada, migration dilewati.');
    } else {
      console.error('❌ Migration failed:', err.message);
    }
  } finally {
    await connection.end();
  }
}

migrate();
