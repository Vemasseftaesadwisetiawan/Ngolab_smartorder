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

  const createStaffTable = `
    CREATE TABLE IF NOT EXISTS staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      status ENUM('Aktif', 'Cuti', 'Non-Aktif') DEFAULT 'Aktif',
      join_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createScheduleTable = `
    CREATE TABLE IF NOT EXISTS staff_schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT,
      day VARCHAR(20) NOT NULL,
      shift ENUM('Pagi', 'Sore', 'Full', 'Custom') DEFAULT 'Pagi',
      start_time TIME,
      end_time TIME,
      assigned_role ENUM('Operasional', 'Support', 'Koki', 'Kasir') DEFAULT 'Operasional',
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    )
  `;

  db.query(createStaffTable, (err) => {
    if (err) return console.error("Gagal buat tabel staff:", err);
    console.log("✅ Tabel 'staff' siap!");

    db.query(createScheduleTable, (err2) => {
      if (err2) return console.error("Gagal buat tabel schedules:", err2);
      console.log("✅ Tabel 'staff_schedules' siap!");

      // Tambah Data Dummy
      const dummyStaff = [
        ['Budi Santoso', 'budi@warung.com', '08123456789', 'Aktif', '2023-01-10'],
        ['Siti Aminah', 'siti@warung.com', '08123456790', 'Aktif', '2023-02-15'],
        ['Agus Setiawan', 'agus@warung.com', '08123456791', 'Aktif', '2023-03-20']
      ];

      db.query('INSERT INTO staff (name, email, phone, status, join_date) VALUES ?', [dummyStaff], (err3, res) => {
        if (err3) {
          console.log("⚠️ Data staff mungkin sudah ada, melewati seeding.");
        } else {
          console.log(`✅ Berhasil menambahkan ${res.affectedRows} staff awal.`);
          
          const firstId = res.insertId;
          const dummySchedules = [
            [firstId, 'Senin', 'Pagi', '08:00:00', '16:00:00', 'Koki'],
            [firstId + 1, 'Senin', 'Pagi', '08:00:00', '16:00:00', 'Operasional'],
            [firstId + 2, 'Senin', 'Sore', '14:00:00', '22:00:00', 'Support']
          ];
          
          db.query('INSERT INTO staff_schedules (staff_id, day, shift, start_time, end_time, assigned_role) VALUES ?', [dummySchedules], (err4) => {
            if (!err4) console.log("✅ Berhasil menambahkan jadwal jaga awal.");
          });
        }
        db.end();
      });
    });
  });
});
