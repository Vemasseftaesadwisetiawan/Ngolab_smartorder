import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi database:', err.message);
    process.exit(1);
  }

  // Menyesuaikan dengan kolom: order_id, customer_name, rating_value, comment, status, reply
  // id tidak dimasukkan karena auto_increment
  const dummyRatings = [
    ['ORD-123', 'Budi Santoso', 5, 'Bakso Malangnya enak banget! Kuahnya gurih.', 'Published', 'Terima kasih Pak Budi!'],
    ['ORD-124', 'Siti Aminah', 4, 'Mie Yaminnya pas manisnya. Mantap.', 'Published', null],
    ['ORD-125', 'Andi Wijaya', 2, 'Pangsitnya agak keras tadi.', 'Reported', null],
    ['ORD-126', 'Anonym', 5, 'Pelayanan cepat dan ramah.', 'Pending', null],
    ['ORD-127', 'Eko Prasetyo', 5, 'Tempatnya bersih dan nyaman.', 'Published', 'Senang mendengarnya!']
  ];

  const query = 'INSERT INTO ratings (order_id, customer_name, rating_value, comment, status, reply) VALUES ?';

  db.query(query, [dummyRatings], (err, result) => {
    if (err) {
      console.error('❌ Gagal memasukkan data seeder:', err.message);
    } else {
      console.log(`✅ Berhasil menambahkan ${result.affectedRows} data rating dummy ke database!`);
    }
    db.end();
  });
});
