import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartorder_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi database:', err.message);
    return;
  }
  console.log('✅ Berhasil terhubung ke database MySQL XAMPP (smartorder_db)!');
});


// ==========================================
// API ROUTES UNTUK STOK & MENU
// ==========================================

// 0. Ambil daftar stok bahan baku
app.get('/api/stock', (req, res) => {
  db.query('SELECT * FROM stock_items', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data stok' });
    
    // Sesuaikan dengan format yang dipakai di App.tsx frontend
    const mapped = results.map(row => ({
      id: row.id,
      name: row.name,
      qty: row.qty,
      unit: row.unit,
      min: row.min_stock,
      status: row.status
    }));
    res.json(mapped);
  });
});

// 1. READ (Ambil semua menu BESERTA RESEPNYA)
app.get('/api/menu', (req, res) => {
  const queryMenu = 'SELECT * FROM menu_items ORDER BY created_at DESC';
  const queryRecipes = 'SELECT * FROM menu_recipes';

  db.query(queryMenu, (err, menus) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data menu' });
    
    db.query(queryRecipes, (err, recipes) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil data resep' });
      
      // Menggabungkan bahan baku (ingredients) ke menu yang cocok
      const finalMenus = menus.map(menu => {
        const menuIngredients = recipes
          .filter(r => r.menu_id === menu.id)
          .map(r => ({ stockId: r.stock_id, amount: r.amount }));
          
        return { ...menu, ingredients: menuIngredients };
      });
      
      res.json(finalMenus);
    });
  });
});

// 2. CREATE (Tambah menu baru + Simpan Resep)
app.post('/api/menu', upload.single('image'), (req, res) => {
  const { name, category, price, description, stock } = req.body;
  const status = Number(stock) > 0 ? 'Tersedia' : 'Habis';
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  let ingredients = [];
  try {
    if (req.body.ingredients) ingredients = JSON.parse(req.body.ingredients);
  } catch (e) {
    console.error("Gagal parse ingredients", e);
  }

  const query = 'INSERT INTO menu_items (name, category, price, description, stock, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, category, price, description, stock, status, image_url], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menambah menu', details: err });
    
    const newMenuId = result.insertId;
    
    // Simpan resep ke tabel menu_recipes secara masal
    if (ingredients.length > 0) {
      const recipeValues = ingredients.map(ing => [newMenuId, ing.stockId, ing.amount]);
      db.query('INSERT INTO menu_recipes (menu_id, stock_id, amount) VALUES ?', [recipeValues], (err2) => {
        if (err2) console.error("Gagal menyimpan resep:", err2);
      });
    }

    res.json({ message: 'Menu berhasil ditambahkan', id: newMenuId, image_url, ingredients });
  });
});

// 3. UPDATE (Edit menu + Update Resep)
app.put('/api/menu/:id', upload.single('image'), (req, res) => {
  const id = req.params.id;
  const { name, category, price, description, stock } = req.body;
  const status = Number(stock) > 0 ? 'Tersedia' : 'Habis';
  
  let ingredients = [];
  try {
    if (req.body.ingredients) ingredients = JSON.parse(req.body.ingredients);
  } catch (e) {}
  
  let query = 'UPDATE menu_items SET name=?, category=?, price=?, description=?, stock=?, status=?';
  let params = [name, category, price, description, stock, status];

  if (req.file) {
    query += ', image_url=?';
    params.push(`/uploads/${req.file.filename}`);
  }
  
  query += ' WHERE id=?';
  params.push(id);

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update menu', details: err });
    
    // Update Resep: Hapus resep lama dari database, ganti dengan yang baru dikirim frontend
    db.query('DELETE FROM menu_recipes WHERE menu_id=?', [id], (err2) => {
      if (ingredients.length > 0) {
        const recipeValues = ingredients.map(ing => [id, ing.stockId, ing.amount]);
        db.query('INSERT INTO menu_recipes (menu_id, stock_id, amount) VALUES ?', [recipeValues], (err3) => {});
      }
    });

    res.json({ message: 'Menu berhasil diupdate' });
  });
});

// 4. DELETE
app.delete('/api/menu/:id', (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM menu_items WHERE id=?';
  // menu_recipes otomatis terhapus karena kita menggunakan ON DELETE CASCADE di database
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus menu', details: err });
    res.json({ message: 'Menu berhasil dihapus' });
  });
});

// 5. TOGGLE DISPLAY (Sembunyikan / Tampilkan Menu)
app.put('/api/menu/:id/display', (req, res) => {
  const id = req.params.id;
  const { displayed } = req.body;
  
  db.query('UPDATE menu_items SET displayed=? WHERE id=?', [displayed, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update status tampilan menu' });
    res.json({ message: 'Status tampilan berhasil diubah' });
  });
});

// ==========================================
// API ROUTES UNTUK TRANSAKSI (ORDERS)
// ==========================================

// 1. GET (Ambil semua pesanan beserta item-nya)
app.get('/api/orders', (req, res) => {
  const queryOrders = 'SELECT * FROM orders ORDER BY created_at DESC';
  const queryItems = 'SELECT * FROM order_items';

  db.query(queryOrders, (err, orders) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
    
    db.query(queryItems, (err, items) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil rincian pesanan' });
      
      const finalOrders = orders.map(order => {
        // Gabungkan item yang sesuai dengan order_id
        const orderItems = items.filter(item => item.order_id === order.id).map(i => ({
          id: i.menu_id,
          name: i.menu_name,
          price: i.price,
          quantity: i.quantity,
          note: i.note
        }));
        
        return {
          id: order.id,
          table: order.destination_label,
          customer: order.customer_name,
          total: Number(order.total),
          status: order.status,
          paymentMethod: order.payment_method,
          amountPaid: Number(order.amount_paid),
          change: Number(order.change_amount),
          type: order.order_type,
          time: new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(order.created_at).toLocaleDateString('id-ID'),
          items: orderItems
        };
      });
      
      res.json(finalOrders);
    });
  });
});

// 2. POST (Buat pesanan baru dari POS)
app.post('/api/orders', (req, res) => {
  const { id, table, customer, items, total, paymentMethod, amountPaid, change, type } = req.body;
  const status = 'Menunggu'; // Status awal pesanan

  const queryOrder = `INSERT INTO orders (id, destination_label, customer_name, total, status, payment_method, amount_paid, change_amount, order_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(queryOrder, [id, table, customer, total, status, paymentMethod, amountPaid, change, type], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan pesanan', details: err });
    
    // Simpan rincian makanan ke order_items
    if (items && items.length > 0) {
      const itemValues = items.map(item => [id, item.id, item.name, item.price, item.quantity, item.note || '']);
      db.query('INSERT INTO order_items (order_id, menu_id, menu_name, price, quantity, note) VALUES ?', [itemValues], (err2) => {
        if (err2) console.error("Gagal menyimpan rincian pesanan:", err2);
        
        // LOGIKA PEMOTONGAN STOK (MENU & BAHAN BAKU)
        items.forEach(orderItem => {
          // 1. Potong porsi di tabel menu_items
          db.query('UPDATE menu_items SET stock = GREATEST(0, stock - ?) WHERE id = ?', [orderItem.quantity, orderItem.id]);
          
          // 2. Cari resep (bahan baku) dari menu ini
          db.query('SELECT stock_id, amount FROM menu_recipes WHERE menu_id = ?', [orderItem.id], (err3, recipes) => {
            if (!err3 && recipes.length > 0) {
              recipes.forEach(recipe => {
                // Total bahan baku yang terpakai = jumlah porsi * takaran resep
                const totalUsed = recipe.amount * orderItem.quantity;
                
                // 3. Potong bahan baku di tabel stock_items dan otomatis update statusnya (Aman/Kritis/Habis)
                const updateStockQuery = `
                  UPDATE stock_items 
                  SET qty = GREATEST(0, qty - ?),
                      status = CASE 
                        WHEN (qty - ?) <= 0 THEN 'Habis'
                        WHEN (qty - ?) <= min_stock THEN 'Kritis'
                        ELSE 'Aman'
                      END
                  WHERE id = ?
                `;
                db.query(updateStockQuery, [totalUsed, totalUsed, totalUsed, recipe.stock_id], (err4) => {
                  if (err4) console.error("Gagal potong stok bahan baku:", err4);
                });
              });
            }
          });
        });
      });
    }
    
    res.json({ message: 'Pesanan berhasil dibuat, stok telah dipotong', id: id });
  });
});

// 3. PUT (Update status pesanan - untuk KDS/Pelayan)
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  db.query('UPDATE orders SET status=? WHERE id=?', [status, orderId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update status pesanan' });
    res.json({ message: 'Status berhasil diubah', id: orderId, newStatus: status });
  });
});

// ==========================================
// API ROUTES UNTUK SMART TAGS (MEJA)
// ==========================================

app.get('/api/smart-tags', (req, res) => {
  db.query('SELECT * FROM smart_tags ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data smart tags' });
    const mapped = results.map(row => ({
      id: row.id,
      type: row.tag_type,
      number: row.label_number,
      capacity: row.capacity,
      zone: row.zone,
      status: row.status,
      smartLink: row.smart_link,
      lastScanned: row.last_scanned
    }));
    res.json(mapped);
  });
});

app.post('/api/smart-tags', (req, res) => {
  const { id, type, number, capacity, zone, status, smartLink } = req.body;
  const query = 'INSERT INTO smart_tags (id, tag_type, label_number, capacity, zone, status, smart_link) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [id, type, number, capacity || null, zone, status, smartLink], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan smart tag', details: err });
    res.json({ message: 'Smart Tag berhasil dibuat', id });
  });
});

app.delete('/api/smart-tags/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM smart_tags WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus smart tag' });
    res.json({ message: 'Smart Tag berhasil dihapus' });
  });
});

// ==========================================
// API ROUTES UNTUK RATING & ULASAN
// ==========================================

app.get('/api/ratings', (req, res) => {
  db.query('SELECT * FROM ratings ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data rating' });
    const mapped = results.map(row => ({
      id: row.id,
      customerName: row.customer_name,
      rating: row.rating_value, // Diubah dari row.rating
      comment: row.comment,
      date: new Date(row.created_at).toLocaleDateString('id-ID'),
      status: row.status,
      orderId: row.order_id,
      reply: row.reply
    }));
    res.json(mapped);
  });
});

app.post('/api/ratings', (req, res) => {
  const { customerName, rating, comment, orderId } = req.body;
  const status = 'Pending'; 
  const query = 'INSERT INTO ratings (customer_name, rating_value, comment, status, order_id) VALUES (?, ?, ?, ?, ?)';
  
  db.query(query, [customerName, rating, comment, status, orderId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal mengirim rating', details: err });
    res.json({ message: 'Rating berhasil dikirim', id: result.insertId });
  });
});

app.put('/api/ratings/:id/status', (req, res) => {
  const { status } = req.body;
  db.query('UPDATE ratings SET status=? WHERE id=?', [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update status rating' });
    res.json({ message: 'Status berhasil diubah' });
  });
});

app.delete('/api/ratings/:id', (req, res) => {
  db.query('DELETE FROM ratings WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus rating' });
    res.json({ message: 'Rating berhasil dihapus' });
  });
});

// ==========================================
// API ROUTES UNTUK USERS & AUTHENTICATION
// ==========================================

// 1. Endpoint Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Terjadi kesalahan server database' });
    
    if (results.length > 0) {
      const user = results[0];
      if (user.status !== 'Active') {
        return res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan oleh Admin' });
      }
      // Jangan pernah kirim password kembali ke frontend
      res.json({ 
        message: 'Login sukses', 
        user: { id: user.id, name: user.name, role: user.role, email: user.email } 
      });
    } else {
      res.status(401).json({ error: 'Email atau password salah' });
    }
  });
});

// 2. Ambil Semua Data User (Untuk Halaman Kelola User)
app.get('/api/users', (req, res) => {
  const query = "SELECT id, name, email, role, status, DATE_FORMAT(joined_date, '%b %Y') as joined FROM users ORDER BY id ASC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data pengguna' });
    res.json(results);
  });
});

// ==========================================
// API ROUTES UNTUK MANAJEMEN STAFF
// ==========================================

// 1. Ambil Semua Staff
app.get('/api/staff', (req, res) => {
  db.query('SELECT *, DATE_FORMAT(join_date, "%Y-%m-%d") as joinDate FROM staff ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data staff' });
    res.json(results);
  });
});

// 2. Tambah Staff Baru
app.post('/api/staff', (req, res) => {
  const { name, email, phone, status, joinDate } = req.body;
  const query = 'INSERT INTO staff (name, email, phone, status, join_date) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, email, phone, status, joinDate], (err, result) => {
    if (err) {
      console.error('❌ Database Error (Tambah Staff):', err.message);
      return res.status(500).json({ error: 'Gagal menambah staff ke database', details: err.message });
    }
    res.json({ message: 'Staff berhasil ditambahkan', id: result.insertId });
  });
});

// 2a. Update Staff
app.put('/api/staff/:id', (req, res) => {
  const { name, email, phone, status } = req.body;
  const query = 'UPDATE staff SET name=?, email=?, phone=?, status=? WHERE id=?';
  db.query(query, [name, email, phone, status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update staff' });
    res.json({ message: 'Staff berhasil diupdate' });
  });
});

// 2b. Hapus Staff
app.delete('/api/staff/:id', (req, res) => {
  db.query('DELETE FROM staff WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus staff' });
    res.json({ message: 'Staff berhasil dihapus' });
  });
});

// 3. Ambil Semua Jadwal Jaga
app.get('/api/schedules', (req, res) => {
  db.query('SELECT * FROM staff_schedules', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil jadwal' });
    res.json(results);
  });
});

// 4. Tambah Jadwal Jaga Baru
app.post('/api/schedules', (req, res) => {
  const { staffId, day, shift, startTime, endTime, assignedRole } = req.body;
  const query = 'INSERT INTO staff_schedules (staff_id, day, shift, start_time, end_time, assigned_role) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [staffId, day, shift, startTime, endTime, assignedRole], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menambah jadwal', details: err });
    res.json({ message: 'Jadwal berhasil ditambahkan', id: result.insertId });
  });
});

// 4a. Hapus Jadwal Jaga
app.delete('/api/schedules/:id', (req, res) => {
  db.query('DELETE FROM staff_schedules WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus jadwal' });
    res.json({ message: 'Jadwal berhasil dihapus' });
  });
});

app.listen(port, () => {
  console.log(`🚀 Server API Backend berjalan di http://localhost:${port}`);
});
