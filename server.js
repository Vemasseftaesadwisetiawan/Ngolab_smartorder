import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import sharp from 'sharp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5014;
const JWT_SECRET = process.env.JWT_SECRET || 'ngolab_smartorder_jwt_secret_key_2026_super_secure';

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
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipe file tidak diizinkan. Gunakan JPG/PNG/WebP/GIF.'));
  }
});

const compressImage = async (req, res, next) => {
  if (!req.file) return next();

  const originalPath = req.file.path;
  const filenameWithoutExt = path.basename(req.file.filename, path.extname(req.file.filename));
  const newFilename = `${filenameWithoutExt}.webp`;
  const newPath = path.join(__dirname, 'uploads', newFilename);

  try {
    await sharp(originalPath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 75 })
      .toFile(newPath);

    if (fs.existsSync(originalPath) && originalPath !== newPath) {
      fs.unlinkSync(originalPath);
    }

    req.file.filename = newFilename;
    req.file.path = newPath;
    req.file.mimetype = 'image/webp';

    console.log(`⚡ Gambar berhasil dikompresi & dikonversi ke WebP: ${newFilename}`);
    next();
  } catch (err) {
    console.error('❌ Gagal mengompresi gambar:', err.message);
    next();
  }
};

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(',').map(s => s.trim()),
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan login dari IP ini. Silakan coba lagi setelah 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid atau telah kadaluarsa.' });
    }
    req.user = user;
    next();
  });
};

const verifyToken = authenticateToken;

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartorder_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Gagal koneksi database:', err.message);
    return;
  }
  console.log('✅ Berhasil terhubung ke database MySQL XAMPP (' + (process.env.DB_NAME || 'smartorder_db') + ') melalui Pool!');
  conn.release();
});

// ==========================================
// API ROUTES UNTUK STOK & MENU
// ==========================================

app.get('/api/stock', authenticateToken, (req, res) => {
  db.query('SELECT * FROM stock_items', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data stok' });
    
    const mapped = results.map(row => {
      const qty = Number(row.qty);
      const min = Number(row.min_stock);
      let status = 'Aman';
      if (qty <= 0) status = 'Habis';
      else if (qty <= min / 2) status = 'Kritis';
      else if (qty <= min) status = 'Menipis';

      if (row.expiry_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(row.expiry_date);
        expiry.setHours(0, 0, 0, 0);
        
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          status = 'Kedaluwarsa';
        } else if (diffDays <= 3) {
          status = 'Hampir Kadaluwarsa';
        }
      }

      let formattedExpiryDate = null;
      if (row.expiry_date) {
        const expDate = new Date(row.expiry_date);
        const yyyy = expDate.getFullYear();
        const mm = String(expDate.getMonth() + 1).padStart(2, '0');
        const dd = String(expDate.getDate()).padStart(2, '0');
        formattedExpiryDate = `${yyyy}-${mm}-${dd}`;
      }

      return {
        id: row.id,
        name: row.name,
        qty: qty,
        unit: row.unit,
        min: min,
        status: status,
        expiry_date: formattedExpiryDate
      };
    });
    res.json(mapped);
  });
});

app.post('/api/stock', authenticateToken, (req, res) => {
  const { name, qty, unit, min, expiry_date } = req.body;
  const qtyNum = Number(qty) || 0;
  const minNum = Number(min) || 0;
  const expiryVal = expiry_date || null;
  
  let status = 'Aman';
  if (qtyNum <= 0) status = 'Habis';
  else if (qtyNum <= minNum / 2) status = 'Kritis';
  else if (qtyNum <= minNum) status = 'Menipis';

  const query = 'INSERT INTO stock_items (name, qty, unit, min_stock, status, expiry_date) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [name, qtyNum, unit, minNum, status, expiryVal], (err, result) => {
    if (err) {
      console.error('❌ Gagal menambah stok:', err.message);
      return res.status(500).json({ error: 'Gagal menambah stok bahan baku', details: err.message });
    }
    res.json({ id: result.insertId, name, qty: qtyNum, unit, min: minNum, status, expiry_date: expiryVal });
  });
});

app.put('/api/stock/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, qty, unit, min, expiry_date } = req.body;
  const qtyNum = Number(qty) || 0;
  const minNum = Number(min) || 0;
  const expiryVal = expiry_date || null;
  
  let status = 'Aman';
  if (qtyNum <= 0) status = 'Habis';
  else if (qtyNum <= minNum / 2) status = 'Kritis';
  else if (qtyNum <= minNum) status = 'Menipis';

  if (expiryVal) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryVal);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      status = 'Kedaluwarsa';
    } else if (diffDays <= 3) {
      status = 'Hampir Kadaluwarsa';
    }
  }

  const query = 'UPDATE stock_items SET name=?, qty=?, unit=?, min_stock=?, status=?, expiry_date=? WHERE id=?';
  db.query(query, [name, qtyNum, unit, minNum, status, expiryVal, id], (err, result) => {
    if (err) {
      console.error('❌ Gagal memperbarui stok:', err.message);
      return res.status(500).json({ error: 'Gagal memperbarui stok bahan baku', details: err.message });
    }
    res.json({ message: 'Stok berhasil diperbarui', id, name, qty: qtyNum, unit, min: minNum, status, expiry_date: expiryVal });
  });
});

app.put('/api/stock/:id/adjust', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const amountNum = Number(amount) || 0;

  db.query('SELECT qty, min_stock FROM stock_items WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Stok bahan baku tidak ditemukan' });
    }
    const currentQty = Number(results[0].qty);
    const minStock = Number(results[0].min_stock);
    const newQty = Math.max(0, currentQty + amountNum);

    let status = 'Aman';
    if (newQty <= 0) status = 'Habis';
    else if (newQty <= minStock / 2) status = 'Kritis';
    else if (newQty <= minStock) status = 'Menipis';

    const query = 'UPDATE stock_items SET qty=?, status=? WHERE id=?';
    db.query(query, [newQty, status, id], (err) => {
      if (err) {
        console.error('❌ Gagal menyesuaikan stok:', err.message);
        return res.status(500).json({ error: 'Gagal menyesuaikan jumlah stok' });
      }
      res.json({ message: 'Stok berhasil disesuaikan', qty: newQty, status });
    });
  });
});

app.delete('/api/stock/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM stock_items WHERE id=?', [id], (err, result) => {
    if (err) {
      console.error('❌ Gagal menghapus stok:', err.message);
      return res.status(500).json({ error: 'Gagal menghapus stok bahan baku' });
    }
    res.json({ message: 'Stok bahan baku berhasil dihapus' });
  });
});

const FRIEND_API_URL = process.env.FRIEND_API_URL || 'http://localhost:3001/api/menu';

app.get('/api/menu', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const queryMenu = `SELECT * FROM menu_items WHERE displayed = 1 AND (availability_type = 'permanent' OR (availability_type = 'scheduled' AND available_from <= ? AND available_to >= ?)) ORDER BY created_at DESC`;
  const queryRecipes = 'SELECT * FROM menu_recipes';

  db.query(queryMenu, [today, today], (err, menus) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data menu lokal' });
    
    db.query(queryRecipes, (err, recipes) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil data resep lokal' });
      
      const localMenus = menus.map(menu => {
        const menuIngredients = recipes
          .filter(r => r.menu_id === menu.id)
          .map(r => ({ stockId: r.stock_id, amount: r.amount }));
          
        const finalStatus = (Number(menu.displayed) === 0 || Number(menu.stock) <= 0) ? 'Habis' : menu.status;
          
        return { 
          ...menu, 
          status: finalStatus, 
          ingredients: menuIngredients,
          promoPrice: menu.promo_price !== null && menu.promo_price !== undefined ? Number(menu.promo_price) : undefined
        };
      });

      if (req.headers['x-loop-prevent'] === 'true') {
        console.log('🔄 Loop terdeteksi. Melewati penarikan menu eksternal.');
        return res.json(localMenus);
      }

      fetch(FRIEND_API_URL)
        .then(async (response) => {
          if (!response.ok) throw new Error('Response server teman tidak OK');
          const externalData = await response.json();
          
          const externalMenus = externalData.map((item) => ({
            ...item,
            id: `ext-${item.id}`,
            name: item.name,
            isExternal: true
          }));

          console.log(`✅ Berhasil menggabungkan ${externalMenus.length} menu dari laptop teman (localhost:3002).`);
          res.json([...localMenus, ...externalMenus]);
        })
        .catch((fetchErr) => {
          console.warn('⚠️ Gagal menarik menu teman, menampilkan menu lokal saja. Error:', fetchErr.message);
          res.json(localMenus);
        });
    });
  });
});

app.post('/api/menu', authenticateToken, upload.single('image'), compressImage, (req, res) => {
  const { name, category, price, description, stock, availability_type, available_from, available_to } = req.body;
  const status = Number(stock) > 0 ? 'Tersedia' : 'Habis';
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  let ingredients = [];
  try {
    if (req.body.ingredients) ingredients = JSON.parse(req.body.ingredients);
  } catch (e) {
    console.error("Gagal parse ingredients", e);
  }

  const query = 'INSERT INTO menu_items (name, category, price, description, stock, status, image_url, availability_type, available_from, available_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, category, price, description, stock, status, image_url, availability_type || 'permanent', available_from || null, available_to || null], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menambah menu', details: err });
    
    const newMenuId = result.insertId;
    
    if (ingredients.length > 0) {
      const recipeValues = ingredients.map(ing => [newMenuId, ing.stockId, ing.amount]);
      db.query('INSERT INTO menu_recipes (menu_id, stock_id, amount) VALUES ?', [recipeValues], (err2) => {
        if (err2) console.error("Gagal menyimpan resep:", err2);
      });
    }

    res.json({ message: 'Menu berhasil ditambahkan', id: newMenuId, image_url, ingredients });
  });
});

app.put('/api/menu/:id', authenticateToken, upload.single('image'), compressImage, (req, res) => {
  const id = req.params.id;
  const { name, category, price, description, stock, availability_type, available_from, available_to } = req.body;
  const status = Number(stock) > 0 ? 'Tersedia' : 'Habis';
  
  let ingredients = [];
  let hasIngredients = false;
  try {
    if (req.body.ingredients !== undefined) {
      ingredients = JSON.parse(req.body.ingredients);
      hasIngredients = true;
    }
  } catch (e) {}
  
  let query = 'UPDATE menu_items SET name=?, category=?, price=?, description=?, stock=?, status=?, availability_type=?, available_from=?, available_to=?';
  let params = [name, category, price, description, stock, status, availability_type || 'permanent', available_from || null, available_to || null];

  if (req.file) {
    query += ', image_url=?';
    params.push(`/uploads/${req.file.filename}`);
  }
  
  query += ' WHERE id=?';
  params.push(id);

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update menu', details: err });
    
    if (hasIngredients) {
      db.query('DELETE FROM menu_recipes WHERE menu_id=?', [id], (err2) => {
        if (ingredients.length > 0) {
          const recipeValues = ingredients.map(ing => [id, ing.stockId, ing.amount]);
          db.query('INSERT INTO menu_recipes (menu_id, stock_id, amount) VALUES ?', [recipeValues], (err3) => {});
        }
      });
    }

    const responsePayload = { message: 'Menu berhasil diupdate' };
    if (req.file) {
      responsePayload.image_url = `/uploads/${req.file.filename}`;
    }
    res.json(responsePayload);
  });
});

app.put('/api/menu/:id/recipe', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { ingredients } = req.body;

  if (!Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Format resep tidak valid' });
  }

  db.query('DELETE FROM menu_recipes WHERE menu_id = ?', [id], (err) => {
    if (err) {
      console.error('❌ Gagal menghapus resep lama:', err.message);
      return res.status(500).json({ error: 'Gagal memperbarui resep' });
    }

    if (ingredients.length === 0) {
      return res.json({ message: 'Resep berhasil diperbarui (kosong)' });
    }

    const recipeValues = ingredients.map(ing => [id, ing.stockId, Number(ing.amount) || 0]);
    db.query('INSERT INTO menu_recipes (menu_id, stock_id, amount) VALUES ?', [recipeValues], (err2) => {
      if (err2) {
        console.error('❌ Gagal menyimpan resep baru:', err2.message);
        return res.status(500).json({ error: 'Gagal menyimpan resep baru' });
      }
      res.json({ message: 'Resep berhasil diperbarui' });
    });
  });
});

app.delete('/api/menu/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM menu_items WHERE id=?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus menu', details: err });
    res.json({ message: 'Menu berhasil dihapus' });
  });
});

app.put('/api/menu/:id/display', authenticateToken, (req, res) => {
  const id = req.params.id;
  const { displayed } = req.body;
  
  db.query('UPDATE menu_items SET displayed=? WHERE id=?', [displayed, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update status tampilan menu' });
    res.json({ message: 'Status tampilan berhasil diubah' });
  });
});

app.put('/api/menu/:id/promo', authenticateToken, (req, res) => {
  const id = req.params.id;
  const { promoPrice } = req.body;
  
  db.query('UPDATE menu_items SET promo_price=? WHERE id=?', [promoPrice === null || promoPrice === undefined ? null : promoPrice, id], (err, result) => {
    if (err) {
      console.error('❌ Gagal update harga promo menu:', err.message);
      return res.status(500).json({ error: 'Gagal update harga promo menu' });
    }
    res.json({ message: 'Harga promo berhasil diubah' });
  });
});

// ==========================================
// API ROUTES UNTUK TRANSAKSI (ORDERS)
// ==========================================

function mapDbStatusToFrontend(dbStatus) {
  if (dbStatus === 'Diproses') return 'Sedang Disiapkan';
  if (dbStatus === 'Siap') return 'Selesai';
  return dbStatus || 'Menunggu';
}

function mapFrontendStatusToDb(feStatus) {
  if (feStatus === 'Sedang Disiapkan') return 'Diproses';
  if (feStatus === 'Selesai') return 'Siap';
  return feStatus || 'Menunggu';
}

const fmtDateTime = (val) => {
  const d = val ? new Date(val) : null;
  if (!d || isNaN(d.getTime())) return { date: '-', time: '-' };
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  };
};

app.get('/api/orders', authenticateToken, (req, res) => {
  const queryOrders = 'SELECT * FROM orders ORDER BY created_at DESC';
  const queryItems = 'SELECT * FROM order_items';

  db.query(queryOrders, (err, orders) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
    
    db.query(queryItems, (err, items) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil rincian pesanan' });
      
      const finalOrders = orders.map(order => {
        const orderItems = items.filter(item => item.order_id === order.id).map(i => ({
          id: i.menu_id,
          name: i.menu_name,
          price: i.price,
          quantity: i.quantity,
          note: i.note
        }));
        
        const { date, time } = fmtDateTime(order.created_at);
        
        return {
          id: order.id,
          table: order.destination_label,
          customer: order.customer_name,
          total: Number(order.total),
          status: mapDbStatusToFrontend(order.status),
          paymentMethod: order.payment_method,
          amountPaid: Number(order.amount_paid),
          change: Number(order.change_amount),
          type: order.order_type,
          time,
          date,
          cookingStartedAt: order.cooking_started_at,
          paymentProofUrl: order.payment_proof ? `${req.protocol}://${req.get('host')}${order.payment_proof}` : null,
          paymentProofStatus: order.payment_status || 'pending',
          voucherCode: order.voucher_code || null,
          rewardName: order.reward_name || null,
          pointsSpent: order.points_spent || null,
          items: orderItems
        };
      });
      
      res.json(finalOrders);
    });
  });
});

const handleCreateOrder = (req, res) => {
  const { id, table, customer, items, total, paymentMethod, amountPaid, change, type, promoCode, userId, voucherCode } = req.body;
  const status = 'Menunggu';

  let validOrderType = 'Dine-In';
  if (type === 'Takeaway' || type === 'Take Away' || type === 'POS') {
    validOrderType = 'Takeaway';
  } else if (type === 'Delivery') {
    validOrderType = 'Delivery';
  } else if (type === 'Dine-In' || type === 'Dine In') {
    validOrderType = 'Dine-In';
  }

  const processOrder = (voucher) => {
    const finalTotal = total;
    const finalAmountPaid = voucher ? 0 : amountPaid;
    const finalChange = voucher ? 0 : change;
    const queryOrder = `INSERT INTO orders (id, destination_label, customer_name, total, status, payment_method, amount_paid, change_amount, order_type, user_id, voucher_code, reward_name, points_spent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(queryOrder, [id, table, customer, finalTotal, status, paymentMethod, finalAmountPaid, finalChange, validOrderType, userId || null, voucher ? voucher.voucher_code : null, voucher ? voucher.reward_name : null, voucher ? voucher.points_spent : null], (err, result) => {
      if (err) return res.status(500).json({ error: 'Gagal menyimpan pesanan', details: err });

      if (items && items.length > 0) {
        const itemValues = items.map(item => [id, item.id, item.name, item.price, item.quantity, item.note || '']);
        db.query('INSERT INTO order_items (order_id, menu_id, menu_name, price, quantity, note) VALUES ?', [itemValues], (err2) => {
          if (err2) console.error("Gagal menyimpan rincian pesanan:", err2);

          if (promoCode) {
            db.query('SELECT usage_count, max_usage, status FROM promos WHERE code = ? LIMIT 1', [promoCode], (errPromo, promoRows) => {
              if (!errPromo && promoRows.length > 0) {
                const promo = promoRows[0];
                const currentUsage = Number(promo.usage_count || 0);
                const maxUsage = promo.max_usage ? Number(promo.max_usage) : null;
                const isValid = promo.status === 'Active' && (maxUsage === null || currentUsage < maxUsage);
              
                if (isValid) {
                  db.query('UPDATE promos SET usage_count = usage_count + 1 WHERE code = ?', [promoCode], (errUpdate) => {
                    if (errUpdate) console.error("Gagal memperbarui kuota penggunaan promo:", errUpdate.message);
                    else console.log(`✅ Kuota promo ${promoCode} berhasil ditambah 1.`);
                  });
                } else {
                  console.warn(`⚠️ Promo ${promoCode} tidak valid atau kuota habis.`);
                }
              } else {
                console.warn(`⚠️ Promo ${promoCode} tidak ditemukan.`);
              }
            });
          }

          items.forEach(orderItem => {
            if (orderItem.id && !String(orderItem.id).startsWith('ext-')) {
              db.query('UPDATE menu_items SET stock = GREATEST(0, stock - ?), status = CASE WHEN GREATEST(0, stock - ?) <= 0 THEN \'Habis\' ELSE status END WHERE id = ?', [orderItem.quantity, orderItem.quantity, orderItem.id]);

              db.query('SELECT r.stock_id, r.amount, s.name FROM menu_recipes r JOIN stock_items s ON r.stock_id = s.id WHERE r.menu_id = ?', [orderItem.id], (err3, recipes) => {
                if (!err3 && recipes.length > 0) {
                  recipes.forEach(recipe => {
                    const totalUsed = recipe.amount * orderItem.quantity;

                    db.query('SELECT id, qty, min_stock, expiry_date FROM stock_items WHERE name = ? ORDER BY (expiry_date IS NULL) ASC, expiry_date ASC, id ASC', [recipe.name], (errBatches, batches) => {
                      if (errBatches || batches.length === 0) {
                        console.warn(`⚠️ Batch pengurutan FEFO tidak ditemukan untuk ${recipe.name}, fallback ke stock_id.`);
                        const updateStockQuery = 'UPDATE stock_items SET qty = GREATEST(0, qty - ?), status = CASE WHEN GREATEST(0, qty - ?) <= 0 THEN \'Habis\' ELSE status END WHERE id = ?';
                        db.query(updateStockQuery, [totalUsed, totalUsed, recipe.stock_id]);
                        return;
                      }

                      let remainingNeed = totalUsed;
                      const activeBatches = batches.filter(b => Number(b.qty) > 0);
                      const targetBatches = activeBatches.length > 0 ? activeBatches : batches;

                      for (let i = 0; i < targetBatches.length; i++) {
                        const batch = targetBatches[i];
                        const currentQty = Number(batch.qty) || 0;

                        let deductAmount = Math.min(currentQty, remainingNeed);

                        if (i === targetBatches.length - 1 && remainingNeed > 0) {
                          deductAmount = remainingNeed;
                        }

                        const newQty = Math.max(0, currentQty - deductAmount);
                        remainingNeed -= deductAmount;

                        const minStock = Number(batch.min_stock) || 0;
                        let newStatus = 'Aman';
                        if (newQty <= 0) newStatus = 'Habis';
                        else if (newQty <= minStock / 2) newStatus = 'Kritis';
                        else if (newQty <= minStock) newStatus = 'Menipis';

                        if (batch.expiry_date) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const expiry = new Date(batch.expiry_date);
                          expiry.setHours(0, 0, 0, 0);

                          const diffTime = expiry.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                          if (diffDays < 0) {
                            newStatus = 'Kedaluwarsa';
                          } else if (diffDays <= 3) {
                            newStatus = 'Hampir Kadaluwarsa';
                          }
                        }

                        db.query('UPDATE stock_items SET qty = ?, status = ? WHERE id = ?', [newQty, newStatus, batch.id], (errUpdate) => {
                          if (errUpdate) console.error("❌ Gagal update stok batch FEFO:", errUpdate.message);
                        });

                        if (remainingNeed <= 0) break;
                      }
                    });
                  });
                }
              });
            }
          });
        });
      }

      if (userId) {
        db.query('SELECT earning_rate, min_purchase FROM point_settings WHERE id = 1', (errSettings, settingsResults) => {
          if (!errSettings && settingsResults.length > 0) {
            const earningRate = Number(settingsResults[0].earning_rate) || 1000;
            const minPurchase = Number(settingsResults[0].min_purchase) || 10000;

            if (total >= minPurchase) {
              const pointsEarned = Math.floor(total / earningRate);
              if (pointsEarned > 0) {
                db.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, userId], (errUpdate) => {
                  if (!errUpdate) {
                    db.query('INSERT INTO point_history (user_id, customer_name, points, source) VALUES (?, ?, ?, ?)',
                      [userId, customer, pointsEarned, `Transaksi Order: ${id}`], (errHist) => {
                        if (errHist) console.error("Gagal mencatat point_history untuk transaksi:", errHist.message);
                      });
                  } else {
                    console.error("Gagal menambah points ke user:", errUpdate.message);
                  }
                });
              }
            }
          }
        });
      }

      res.json({ message: 'Pesanan berhasil dibuat, stok telah dipotong', id: id });
    });
  };

  if (!voucherCode) {
    return processOrder(null);
  }

  db.query('SELECT id, reward_id, reward_name, points_spent, status FROM redeem_history WHERE voucher_code = ? AND status = ? LIMIT 1', [voucherCode, 'active'], (err, redeemRows) => {
    if (err) return res.status(500).json({ error: 'Gagal memvalidasi voucher', details: err.message });
    if (!redeemRows.length) return res.status(400).json({ error: 'Voucher tidak ditemukan atau sudah digunakan' });

    const redeem = redeemRows[0];
    const resolveRewardInfo = (cb) => {
      const fallback = {
        voucher_code: voucherCode,
        reward_name: redeem.reward_name || 'Voucher Reward',
        points_spent: redeem.points_spent || 0
      };

      if (!redeem.reward_id) return cb(fallback);

      db.query('SELECT name, points FROM point_rewards WHERE id = ? LIMIT 1', [redeem.reward_id], (err2, rewardRows) => {
        if (err2 || !rewardRows.length) return cb(fallback);

        const reward = rewardRows[0];
        cb({
          voucher_code: voucherCode,
          reward_name: reward.name,
          points_spent: Number(reward.points || 0)
        });
      });
    };

    db.query('UPDATE redeem_history SET status = ? WHERE id = ?', ['used', redeem.id], (err) => {
      if (err) return res.status(500).json({ error: 'Gagal memakai voucher', details: err.message });
      resolveRewardInfo((voucher) => processOrder(voucher));
    });
  });
};

app.post('/api/orders', handleCreateOrder);
app.post('/api/order', handleCreateOrder);

app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const dbStatus = mapFrontendStatusToDb(status);

  if (dbStatus === 'Diproses') {
    db.query('UPDATE orders SET status=?, cooking_started_at=NOW() WHERE id=?', [dbStatus, orderId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Gagal update status pesanan' });
      res.json({ message: 'Status berhasil diubah', id: orderId, newStatus: status });
    });
  } else {
    db.query('UPDATE orders SET status=? WHERE id=?', [dbStatus, orderId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Gagal update status pesanan' });
      
      if (dbStatus === 'Siap' || dbStatus === 'Selesai') {
        db.query('UPDATE orders SET payment_status="Terverifikasi" WHERE id=? AND payment_status="Menunggu Validasi"', [orderId], (err2) => {
          if (err2) console.error('Gagal update payment_status:', err2.message);
        });
      }
      
      res.json({ message: 'Status berhasil diubah', id: orderId, newStatus: status });
    });
  }
});

app.post('/api/orders/:id/payment-proof', upload.single('paymentProof'), compressImage, (req, res) => {
  const orderId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'File bukti pembayaran wajib diupload' });
  
  const paymentProofUrl = `/uploads/${req.file.filename}`;
  
  db.query('UPDATE orders SET payment_proof=?, payment_status="Menunggu Validasi" WHERE id=?', [paymentProofUrl, orderId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan bukti pembayaran', details: err.message });
    res.json({ message: 'Bukti pembayaran berhasil dikirim dan menunggu verifikasi', paymentProofUrl });
  });
});

app.put('/api/orders/:id/payment-proof/status', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status harus "approved" atau "rejected"' });
  }
  
  const paymentDbStatus = status === 'approved' ? 'Terverifikasi' : 'Ditolak';
  
  db.query('UPDATE orders SET payment_status=? WHERE id=?', [paymentDbStatus, orderId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal memperbarui status verifikasi' });
    
    if (status === 'approved') {
      db.query('UPDATE orders SET status="Siap", cooking_started_at=COALESCE(cooking_started_at, NOW()) WHERE id=?', [orderId], (err2) => {
        if (err2) console.error('Gagal update status pesanan:', err2.message);
      });
    }
    
    res.json({ message: `Bukti pembayaran berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`, status: paymentDbStatus });
  });
});

const handleGetOrderStatus = (req, res) => {
  const orderId = req.params.id;
  db.query('SELECT status FROM orders WHERE id = ?', [orderId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengecek status' });
    if (results.length > 0) {
      res.json({ status: mapDbStatusToFrontend(results[0].status) });
    } else {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
  });
};

app.get('/api/orders/:id', handleGetOrderStatus);
app.get('/api/order/:id', handleGetOrderStatus);

app.get('/api/users/:id/orders', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const queryOrders = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
  const queryItems = 'SELECT oi.* FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ?';

  db.query(queryOrders, [userId], (err, orders) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
    
    db.query(queryItems, [userId], (err, items) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil rincian pesanan' });
      
      const finalOrders = orders.map(order => {
        const orderItems = items.filter(item => item.order_id === order.id).map(i => ({
          id: i.menu_id,
          name: i.menu_name,
          price: i.price,
          quantity: i.quantity,
          note: i.note
        }));
        
        const { date, time } = fmtDateTime(order.created_at);
        
        return {
          id: order.id,
          table: order.destination_label,
          customer: order.customer_name,
          total: Number(order.total),
          status: mapDbStatusToFrontend(order.status),
          paymentMethod: order.payment_method,
          amountPaid: Number(order.amount_paid),
          change: Number(order.change_amount),
          type: order.order_type,
          time,
          date,
          cookingStartedAt: order.cooking_started_at,
          paymentProofUrl: order.payment_proof ? `${req.protocol}://${req.get('host')}${order.payment_proof}` : null,
          paymentProofStatus: order.payment_status || 'pending',
          voucherCode: order.voucher_code || null,
          rewardName: order.reward_name || null,
          pointsSpent: order.points_spent || null,
          items: orderItems
        };
      });
      
      res.json(finalOrders);
    });
  });
});

// ==========================================
// API ROUTES UNTUK SMART TAGS (MEJA)
// ==========================================

app.get('/api/public/smart-tags', (req, res) => {
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

app.get('/api/smart-tags', authenticateToken, (req, res) => {
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

app.put('/api/smart-tags/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { type, number, capacity, zone, status, smartLink } = req.body;
  const query = 'UPDATE smart_tags SET tag_type=?, label_number=?, capacity=?, zone=?, status=?, smart_link=? WHERE id=?';
  db.query(query, [type || 'Meja', number, capacity || null, zone || null, status || 'Tersedia', smartLink || null, id], (err, result) => {
    if (err) {
      console.error('❌ Gagal update smart tag:', err.message);
      return res.status(500).json({ error: 'Gagal update smart tag', details: err.message });
    }
    res.json({ message: 'Smart tag berhasil diperbarui', id });
  });
});

app.put('/api/smart-tags/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const query = 'UPDATE smart_tags SET status=? WHERE id=?';
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('❌ Gagal update status smart tag:', err.message);
      return res.status(500).json({ error: 'Gagal update status smart tag' });
    }
    res.json({ message: 'Status smart tag berhasil diubah', id, status });
  });
});

app.delete('/api/smart-tags/:id', authenticateToken, (req, res) => {
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
  const query = `
    SELECT r.*, m.name AS menu_name 
    FROM ratings r 
    LEFT JOIN menu_items m ON r.menu_id = m.id 
    ORDER BY r.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data rating' });
    const mapped = results.map(row => {
      let mappedStatus = 'Pending';
      if (row.status === 'Ditampilkan') mappedStatus = 'Published';
      else if (row.status === 'Disembunyikan') mappedStatus = 'Reported';
      else if (row.status === 'Pending') mappedStatus = 'Pending';
      else if (row.status === 'Published') mappedStatus = 'Published';
      else if (row.status === 'Reported') mappedStatus = 'Reported';

      return {
        id: row.id,
        customerName: row.customer_name,
        rating: row.rating_value,
        comment: row.comment,
        date: new Date(row.created_at).toLocaleDateString('id-ID'),
        status: mappedStatus,
        orderId: row.order_id,
        reply: row.reply,
        menuId: row.menu_id,
        menuName: row.menu_name
      };
    });
    res.json(mapped);
  });
});

app.post('/api/ratings', (req, res) => {
  const { customerName, rating, comment, orderId, menuId } = req.body;
  const status = 'Pending'; 

  if (menuId && String(menuId).startsWith('ext-')) {
    const originalMenuId = String(menuId).replace('ext-', '');
    const friendBaseUrl = FRIEND_API_URL.replace('/api/menu', '');
    const friendRatingsUrl = `${friendBaseUrl}/api/ratings`;

    console.log(`Forwarding rating untuk menu eksternal ID ${originalMenuId} ke server rekan: ${friendRatingsUrl}`);

    fetch(friendRatingsUrl, {
      method: 'POST',
      body: JSON.stringify({
        customerName,
        rating,
        comment,
        orderId,
        menuId: originalMenuId
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Server rekan merespon dengan status ${response.status}`);
      }
      const data = await response.json();
      res.json({ success: true, message: 'Rating berhasil diteruskan ke rekan', details: data });
    })
    .catch((err) => {
      console.error('Error forwarding rating to friend:', err.message);
      res.status(500).json({ error: 'Gagal meneruskan ulasan ke database rekan', details: err.message });
    });
    return;
  }

  const query = 'INSERT INTO ratings (customer_name, rating_value, comment, status, order_id, menu_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [customerName, rating, comment, status, orderId || null, menuId || null], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal mengirim rating', details: err });
    res.json({ message: 'Rating berhasil dikirim', id: result.insertId });
  });
});

app.put('/api/ratings/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  let dbStatus = 'Pending';
  if (status === 'Published') dbStatus = 'Ditampilkan';
  else if (status === 'Reported') dbStatus = 'Disembunyikan';
  else if (status === 'Pending') dbStatus = 'Pending';
  else if (status === 'Ditampilkan') dbStatus = 'Ditampilkan';
  else if (status === 'Disembunyikan') dbStatus = 'Disembunyikan';

  db.query('UPDATE ratings SET status=? WHERE id=?', [dbStatus, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update status rating' });
    res.json({ message: 'Status berhasil diubah' });
  });
});

app.put('/api/ratings/:id/reply', authenticateToken, (req, res) => {
  const { reply } = req.body;
  db.query('UPDATE ratings SET reply=? WHERE id=?', [reply, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal membalas ulasan' });
    res.json({ message: 'Balasan berhasil disimpan' });
  });
});

app.delete('/api/ratings/:id', authenticateToken, (req, res) => {
  db.query('DELETE FROM ratings WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus rating' });
    res.json({ message: 'Rating berhasil dihapus' });
  });
});

// ==========================================
// API ROUTES UNTUK USERS & AUTHENTICATION
// ==========================================

app.post('/api/login', loginLimiter, (req, res) => {
  const { email, emailNim, password } = req.body;
  const loginIdentifier = email || emailNim;
  
  if (!loginIdentifier || !password) {
    return res.status(400).json({ success: false, message: 'Email/NIM dan password harus diisi' });
  }

  db.query('SHOW COLUMNS FROM users', (err, cols) => {
    if (err) return res.status(500).json({ success: false, message: 'Kesalahan memeriksa skema database' });
    const colNames = cols.map(c => c.Field);
    
    let query = 'SELECT * FROM users WHERE (email = ?';
    const params = [loginIdentifier];
    
    if (colNames.includes('nim')) {
      query += ' OR nim = ?';
      params.push(loginIdentifier);
    }
    
    if (colNames.includes('phone')) {
      query += ' OR phone = ?';
      params.push(loginIdentifier);
    }
    
    query += ')';
    
    db.query(query, params, async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Terjadi kesalahan server database' });
      
      if (results.length > 0) {
        const user = results[0];
        if (user.status !== 'Active' && user.status !== 'Aktif') {
          return res.status(403).json({ success: false, message: 'Akun Anda sedang dinonaktifkan oleh Admin' });
        }

        let passwordMatch = false;
        if (user.password) {
          try {
            passwordMatch = await bcrypt.compare(password, user.password);
          } catch (e) {
            passwordMatch = false;
          }

          if (!passwordMatch && password === user.password) {
            passwordMatch = true;
            try {
              const upgradedHash = await bcrypt.hash(password, 10);
              db.query('UPDATE users SET password = ? WHERE id = ?', [upgradedHash, user.id]);
              console.log(`🔒 Password pengguna ID ${user.id} berhasil di-upgrade ke hash bcrypt.`);
            } catch (upgradeErr) {
              console.error('Gagal upgrade hash password:', upgradeErr.message);
            }
          }
        }

        if (!passwordMatch) {
          return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }
        
        let frontendRole = 'User';
        if (user.role === 'admin') frontendRole = 'Admin';
        else if (user.role === 'kasir') frontendRole = 'Kasir';
        else if (user.role === 'koki') frontendRole = 'Koki';
        else if (user.role === 'user') frontendRole = 'User';

        const token = jwt.sign(
          { id: user.id, name: user.name, role: frontendRole, email: user.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ 
          success: true,
          message: 'Login sukses', 
          token,
          user: { 
            id: user.id, 
            name: user.name, 
            role: frontendRole, 
            email: user.email,
            phone: user.phone || '',
            nim: user.nim || '',
            points: user.points || 0
          } 
        });
      } else {
        res.status(401).json({ success: false, message: 'Email atau password salah' });
      }
    });
  });
});

app.post('/api/register', (req, res) => {
  const { name, emailNim, phone, password, role } = req.body;
  
  if (!name || !emailNim || !password) {
    return res.status(400).json({ success: false, message: 'Nama, Email/NIM, dan password wajib diisi' });
  }
  
  db.query('SHOW COLUMNS FROM users', async (err, cols) => {
    if (err) return res.status(500).json({ success: false, message: 'Kesalahan memeriksa skema database' });
    const colNames = cols.map(c => c.Field);
    
    let checkQuery = 'SELECT * FROM users WHERE email = ?';
    const checkParams = [emailNim];
    if (colNames.includes('nim')) {
      checkQuery += ' OR nim = ?';
      checkParams.push(emailNim);
    }
    if (colNames.includes('phone') && phone) {
      checkQuery += ' OR phone = ?';
      checkParams.push(phone);
    }
    
    db.query(checkQuery, checkParams, async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Kesalahan memeriksa email terdaftar' });
      
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'Email, NIM, atau nomor HP sudah terdaftar' });
      }
      
      let dbRole = 'user';
      if (role === 'Admin' || role === 'admin') dbRole = 'admin';
      else if (role === 'Kasir' || role === 'kasir' || role === 'Staff Operasional') dbRole = 'kasir';
      else if (role === 'Koki' || role === 'koki' || role === 'Staff Dapur') dbRole = 'koki';
      else if (role === 'User' || role === 'user') dbRole = 'user';
      else if (role === 'Staff' || role === 'Manager') dbRole = 'kasir';

      let hashedPassword = password;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (hashErr) {
        console.error('Gagal hash password:', hashErr.message);
        return res.status(500).json({ success: false, message: 'Gagal mengamankan kata sandi' });
      }

      const fields = ['name', 'password', 'role', 'status'];
      const values = [name, hashedPassword, dbRole, 'Active'];
      
      if (colNames.includes('nim') && /^\d+$/.test(emailNim)) {
        fields.push('nim');
        values.push(emailNim);
        fields.push('email');
        values.push(emailNim + '@student.unila.ac.id');
      } else {
        fields.push('email');
        values.push(emailNim);
      }
      
      if (colNames.includes('phone') && phone) {
        fields.push('phone');
        values.push(phone);
      }
      
      if (colNames.includes('joined_date')) {
        fields.push('joined_date');
        values.push(new Date());
      } else if (colNames.includes('joined')) {
        fields.push('joined');
        values.push(new Date());
      }
      
      const placeholders = fields.map(() => '?').join(', ');
      const sql = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;
      
      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("Gagal registrasi user:", err);
          return res.status(500).json({ success: false, message: 'Gagal mendaftarkan akun ke database' });
        }
        res.json({ success: true, message: 'Registrasi berhasil', userId: result.insertId });
      });
    });
  });
});

app.get('/api/users', authenticateToken, (req, res) => {
  db.query('SHOW COLUMNS FROM users', (err, cols) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil skema user' });
    const colNames = cols.map(c => c.Field);
    const joinedCol = colNames.includes('joined_date') ? 'joined_date' : (colNames.includes('joined') ? 'joined' : 'created_at');
    const query = `SELECT id, name, email, role, status, points, DATE_FORMAT(${joinedCol}, '%b %Y') as joined FROM users ORDER BY id ASC`;
    
    db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil data pengguna' });
      
      const mapped = results.map(user => {
        let frontendRole = 'User';
        if (user.role === 'admin') frontendRole = 'Admin';
        else if (user.role === 'kasir') frontendRole = 'Kasir';
        else if (user.role === 'koki') frontendRole = 'Koki';
        else if (user.role === 'user') frontendRole = 'User';
        
        return {
          ...user,
          role: frontendRole
        };
      });
      res.json(mapped);
    });
  });
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, password } = req.body;

  let dbRole = 'user';
  if (role === 'Admin' || role === 'admin') dbRole = 'admin';
  else if (role === 'Kasir' || role === 'kasir' || role === 'Staff Operasional') dbRole = 'kasir';
  else if (role === 'Koki' || role === 'koki' || role === 'Staff Dapur') dbRole = 'koki';
  else if (role === 'User' || role === 'user') dbRole = 'user';

  let dbStatus = 'Active';
  if (status === 'Non-aktif' || status === 'Inactive') dbStatus = 'Inactive';
  else if (status === 'Aktif' || status === 'Active') dbStatus = 'Active';

  let query = 'UPDATE users SET name=?, email=?, role=?, status=?';
  let params = [name, email, dbRole, dbStatus];

  if (password && password.trim()) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password=?';
      params.push(hashedPassword);
    } catch (hashErr) {
      console.error('Gagal hash update password:', hashErr);
    }
  }

  query += ' WHERE id=?';
  params.push(id);

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('❌ Gagal update pengguna:', err.message);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui pengguna di database' });
    }
    res.json({ success: true, message: 'Pengguna berhasil diperbarui' });
  });
});

app.put('/api/users/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const dbStatus = (status === 'Aktif' || status === 'Active') ? 'Active' : 'Inactive';

  db.query('UPDATE users SET status=? WHERE id=?', [dbStatus, id], (err, result) => {
    if (err) {
      console.error('❌ Gagal update status pengguna:', err.message);
      return res.status(500).json({ success: false, message: 'Gagal update status pengguna' });
    }
    res.json({ success: true, message: 'Status pengguna berhasil diubah' });
  });
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Gagal menghapus pengguna' });
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  });
});

// ==========================================
// API ROUTES UNTUK MANAJEMEN STAFF
// ==========================================

app.get('/api/staff', authenticateToken, (req, res) => {
  db.query('SELECT *, DATE_FORMAT(join_date, "%Y-%m-%d") as joinDate FROM staff ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data staff' });
    res.json(results);
  });
});

app.post('/api/staff', authenticateToken, (req, res) => {
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

app.put('/api/staff/:id', authenticateToken, (req, res) => {
  const { name, email, phone, status } = req.body;
  const query = 'UPDATE staff SET name=?, email=?, phone=?, status=? WHERE id=?';
  db.query(query, [name, email, phone, status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update staff' });
    res.json({ message: 'Staff berhasil diupdate' });
  });
});

app.delete('/api/staff/:id', authenticateToken, (req, res) => {
  db.query('DELETE FROM staff WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus staff' });
    res.json({ message: 'Staff berhasil dihapus' });
  });
});

app.get('/api/schedules', authenticateToken, (req, res) => {
  db.query('SELECT * FROM staff_schedules', (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil jadwal' });
    res.json(results);
  });
});

app.post('/api/schedules', authenticateToken, (req, res) => {
  const { staffId, day, shift, startTime, endTime, assignedRole } = req.body;
  const query = 'INSERT INTO staff_schedules (staff_id, day, shift, start_time, end_time, assigned_role) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [staffId, day, shift, startTime, endTime, assignedRole], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menambah jadwal', details: err });
    res.json({ message: 'Jadwal berhasil ditambahkan', id: result.insertId });
  });
});

app.delete('/api/schedules/:id', authenticateToken, (req, res) => {
  db.query('DELETE FROM staff_schedules WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus jadwal' });
    res.json({ message: 'Jadwal berhasil dihapus' });
  });
});

// ==========================================
// API ROUTES UNTUK MANAJEMEN PROMO
// ==========================================

app.get('/api/promos', authenticateToken, (req, res) => {
  db.query('SELECT * FROM promos ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('❌ Gagal mengambil promo:', err.message);
      return res.status(500).json({ error: 'Gagal mengambil data promo' });
    }
    const mapped = results.map(row => ({
      id: row.id,
      title: row.title,
      code: row.code,
      discount: parseFloat(row.discount),
      type: row.type,
      period: row.period,
      status: row.status,
      usageCount: Number(row.usage_count),
      maxUsage: row.max_usage ? Number(row.max_usage) : null,
      minPurchase: Number(row.min_purchase)
    }));
    res.json(mapped);
  });
});

app.post('/api/promos', authenticateToken, (req, res) => {
  const { id, title, code, discount, type, period, status, maxUsage, minPurchase } = req.body;
  const query = 'INSERT INTO promos (id, title, code, discount, type, period, status, usage_count, max_usage, min_purchase) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)';
  db.query(query, [id, title, code, discount, type, period, status || 'Active', maxUsage, minPurchase], (err, result) => {
    if (err) {
      console.error('❌ Gagal menambah promo:', err.message);
      return res.status(500).json({ error: 'Gagal menambah promo', details: err.message });
    }
    res.json({ message: 'Promo berhasil ditambahkan', id });
  });
});

app.put('/api/promos/:id', authenticateToken, (req, res) => {
  const { title, code, discount, type, period, maxUsage, minPurchase } = req.body;
  const query = 'UPDATE promos SET title=?, code=?, discount=?, type=?, period=?, max_usage=?, min_purchase=? WHERE id=?';
  db.query(query, [title, code, discount, type, period, maxUsage, minPurchase, req.params.id], (err, result) => {
    if (err) {
      console.error('❌ Gagal memperbarui promo:', err.message);
      return res.status(500).json({ error: 'Gagal memperbarui promo', details: err.message });
    }
    res.json({ message: 'Promo berhasil diperbarui' });
  });
});

app.delete('/api/promos/:id', authenticateToken, (req, res) => {
  db.query('DELETE FROM promos WHERE id=?', [req.params.id], (err, result) => {
    if (err) {
      console.error('❌ Gagal menghapus promo:', err.message);
      return res.status(500).json({ error: 'Gagal menghapus promo' });
    }
    res.json({ message: 'Promo berhasil dihapus' });
  });
});

// ==========================================
// API ROUTES UNTUK MANAJEMEN POIN & VOUCHER
// ==========================================

app.get('/api/point-settings', authenticateToken, (req, res) => {
  db.query('SELECT * FROM point_settings WHERE id = 1', (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: 'Gagal mengambil aturan poin' });
    }
    res.json({
      earningRate: Number(results[0].earning_rate),
      minPurchase: Number(results[0].min_purchase)
    });
  });
});

app.post('/api/point-settings', authenticateToken, (req, res) => {
  const { earningRate, minPurchase } = req.body;
  db.query('UPDATE point_settings SET earning_rate = ?, min_purchase = ? WHERE id = 1', [earningRate, minPurchase], (err) => {
    if (err) {
      console.error('❌ Gagal memperbarui aturan poin:', err.message);
      return res.status(500).json({ error: 'Gagal memperbarui aturan poin' });
    }
    res.json({ success: true, message: 'Aturan poin berhasil diperbarui' });
  });
});

app.get('/api/point-rewards', authenticateToken, (req, res) => {
  db.query('SELECT * FROM point_rewards ORDER BY points ASC', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal mengambil katalog hadiah' });
    }
    res.json(results);
  });
});

app.post('/api/point-rewards', authenticateToken, (req, res) => {
  const { name, points, description, status } = req.body;
  const pts = Number(points) || 0;
  const desc = description || '';
  const st = status || 'Tersedia';

  db.query('INSERT INTO point_rewards (name, points, points_required, description, status) VALUES (?, ?, ?, ?, ?)', [name, pts, pts, desc, st], (err, result) => {
    if (err) {
      console.error('❌ Gagal menambah hadiah:', err.message);
      return res.status(500).json({ error: 'Gagal menambah hadiah ke katalog', details: err.message });
    }
    res.json({ id: result.insertId, name, points: pts, description: desc, status: st });
  });
});

app.put('/api/point-rewards/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, points, description, status } = req.body;
  const pts = Number(points) || 0;
  const desc = description || '';
  const st = status || 'Tersedia';

  db.query('UPDATE point_rewards SET name=?, points=?, points_required=?, description=?, status=? WHERE id=?', [name, pts, pts, desc, st, id], (err, result) => {
    if (err) {
      console.error('❌ Gagal mengupdate hadiah:', err.message);
      return res.status(500).json({ error: 'Gagal mengupdate hadiah di katalog', details: err.message });
    }
    res.json({ success: true, message: 'Hadiah berhasil diupdate', id, name, points: pts, description: desc, status: st });
  });
});

app.delete('/api/point-rewards/:id', authenticateToken, (req, res) => {
  db.query('DELETE FROM point_rewards WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('❌ Gagal menghapus hadiah:', err.message);
      return res.status(500).json({ error: 'Gagal menghapus hadiah dari katalog' });
    }
    res.json({ success: true, message: 'Hadiah berhasil dihapus dari katalog' });
  });
});

// ==========================================
// API ROUTES REDEEM POIN
// ==========================================

app.post('/api/point-rewards/:id/redeem', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const rewardId = req.params.id;

  db.query('SELECT * FROM point_rewards WHERE id = ?', [rewardId], (err, rewards) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil hadiah' });
    if (rewards.length === 0) return res.status(404).json({ error: 'Hadiah tidak ditemukan' });

    const reward = rewards[0];
    if (reward.status !== 'Tersedia') return res.status(400).json({ error: 'Hadiah tidak tersedia' });

    const pointsRequired = Number(reward.points || reward.points_required || 0);

    db.query('SELECT points, name FROM users WHERE id = ?', [userId], (err, users) => {
      if (err || users.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

      const currentPoints = Number(users[0].points || 0);
      if (currentPoints < pointsRequired) return res.status(400).json({ error: 'Poin tidak mencukupi' });

      db.query('SELECT id FROM redeem_history WHERE user_id = ? AND reward_id = ? AND status IN ("active", "used") LIMIT 1', [userId, rewardId], (err, existingRedeems) => {
        if (err) return res.status(500).json({ error: 'Gagal memeriksa riwayat redeem' });
        if (existingRedeems.length > 0) return res.status(400).json({ error: 'Anda sudah menukar hadiah ini' });

        const remainingPoints = currentPoints - pointsRequired;
        const voucherCode = 'RWD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        db.query('UPDATE users SET points = ? WHERE id = ?', [remainingPoints, userId], (err) => {
          if (err) {
            console.error('❌ Gagal mengurangi poin user:', err.message);
            return res.status(500).json({ error: 'Gagal memproses redeem' });
          }

          db.query('INSERT INTO redeem_history (user_id, reward_id, reward_name, points_spent, voucher_code) VALUES (?, ?, ?, ?, ?)',
            [userId, reward.id, reward.name, pointsRequired, voucherCode],
            (err, result) => {
              if (err) {
                console.error('❌ Gagal mencatat redeem_history:', err.message);
                return res.status(500).json({ error: 'Gagal menyimpan riwayat redeem' });
              }

              db.query('INSERT INTO point_history (user_id, customer_name, points, source) VALUES (?, ?, ?, ?)',
                [userId, users[0].name, -pointsRequired, `Redeem: ${reward.name}`],
                (err) => {
                  if (err) console.error('❌ Gagal mencatat point_history untuk redeem:', err.message);
                }
              );

              res.json({
                success: true,
                reward: {
                  id: reward.id,
                  name: reward.name,
                  points: pointsRequired
                },
                remainingPoints,
                voucherCode,
                redeemedAt: new Date().toISOString()
              });
            }
          );
        });
      });
    });
  });
});

app.get('/api/redeem-history', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT * FROM redeem_history WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal mengambil riwayat redeem' });
    }
    res.json(results);
  });
});

app.get('/api/point-rewards/:id/redeem-status', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const rewardId = req.params.id;

  db.query('SELECT id FROM redeem_history WHERE user_id = ? AND reward_id = ? AND status IN ("active", "used") LIMIT 1', [userId, rewardId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memeriksa status redeem' });
    }
    res.json({ redeemed: results.length > 0 });
  });
});

app.get('/api/point-history', authenticateToken, (req, res) => {
  db.query('SELECT * FROM point_history ORDER BY created_at DESC', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal mengambil riwayat poin' });
    }
    res.json(results);
  });
});

app.get('/api/users/:id/points', authenticateToken, (req, res) => {
  db.query('SELECT points FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ points: results[0].points });
  });
});

app.post('/api/users/:id/points', authenticateToken, (req, res) => {
  const { amount, source, customerName } = req.body;
  const userId = req.params.id;

  db.query('SELECT points, name FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const currentPoints = Number(results[0].points);
    const finalPoints = Math.max(0, currentPoints + Number(amount));
    const name = customerName || results[0].name;

    db.query('UPDATE users SET points = ? WHERE id = ?', [finalPoints, userId], (err) => {
      if (err) {
        console.error('❌ Gagal memperbarui poin user:', err.message);
        return res.status(500).json({ error: 'Gagal memperbarui poin' });
      }

      db.query('INSERT INTO point_history (user_id, customer_name, points, source) VALUES (?, ?, ?, ?)', [userId, name, amount, source], (err) => {
        if (err) console.error('❌ Gagal mencatat riwayat poin:', err.message);
      });

      res.json({ success: true, points: finalPoints });
    });
  });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server API Backend berjalan di http://localhost:${port}`);
});
