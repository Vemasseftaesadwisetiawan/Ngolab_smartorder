import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const __filename = path.resolve(process.argv[1]);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  app.use(express.json());

  // Fix camera permission di HTTPS
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera *; microphone *');
    next();
  });

  // API Routes
  const KASIR_DOMAIN = process.env.KASIR_DOMAIN || "http://192.168.1.9:3001";
  const API_KASIR_URL = `${KASIR_DOMAIN}/api/menu`;
  const APPS_SCRIPT_URL = process.env.VITE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbx7gVD2jM-XpZg5ZVkjSsp70RO0corDrUN9gM2SF-NkA2SMo0Iejt5wt8HF3Lw_WZqiYw/exec";
  const AIRGESTURE_DOMAIN = process.env.AIRGESTURE_DOMAIN || "http://192.168.1.9:3002";
  const AIRGESTURE_API_KEY = process.env.AIRGESTURE_API_KEY || "tangolab-secret-key-2026";

  const TANGOLAB_BASE_URL = "https://geasture.kolab.top";

  // State in-memory untuk demo/fallback offline
  const userPointsMap = new Map<string, number>();
  const userOrdersMap = new Map<string, any[]>();

  const DUMMY_PROMOS = [
    {
      id: 1,
      code: "DISKON10",
      title: "Promo Diskon 10%",
      description: "Diskon 10% untuk semua pembelian dengan minimum belanja Rp20.000",
      type: "Persentase",
      discount: 10,
      minPurchase: 20000,
      maxUsage: 100,
      usageCount: 5,
      status: "Active",
      period: "30 Hari"
    },
    {
      id: 2,
      code: "JUMATBERKAH",
      title: "Voucher Jumat Berkah",
      description: "Potongan harga Rp5.000 khusus hari Jumat dengan minimum belanja Rp15.000",
      type: "Nominal",
      discount: 5000,
      minPurchase: 15000,
      maxUsage: 50,
      usageCount: 12,
      status: "Active",
      period: "30 Hari"
    },
    {
      id: 3,
      code: "MASYANTO20K",
      title: "Voucher Mantap Mas Yanto",
      description: "Potongan harga Rp20.000 dengan minimum belanja Rp50.000",
      type: "Nominal",
      discount: 20000,
      minPurchase: 50000,
      maxUsage: 10,
      usageCount: 2,
      status: "Active",
      period: "15 Hari"
    }
  ];

  const DUMMY_POINT_SETTINGS = {
    earningRate: 1000,
    minPurchase: 10000
  };

  const DUMMY_POINT_REWARDS = [
    {
      id: 1,
      name: "Voucher Rp 5.000",
      points: 50,
      description: "Tukarkan 50 poin untuk mendapatkan voucher Rp 5.000"
    },
    {
      id: 2,
      name: "Es Teh Manis",
      points: 30,
      description: "Tukarkan 30 poin untuk mendapatkan 1 gelas Es Teh Manis"
    },
    {
      id: 3,
      name: "Bakso Mas Yanto Spesial",
      points: 150,
      description: "Tukarkan 150 poin untuk mendapatkan 1 porsi Bakso Mas Yanto Spesial"
    },
    {
      id: 4,
      name: "Voucher Rp 20.000",
      points: 180,
      description: "Tukarkan 180 poin untuk mendapatkan voucher Rp 20.000"
    }
  ];

  // Tangolab User API
  app.get("/api/tangolab/users/:user_id/recommendations", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/users/${req.params.user_id}/recommendations`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab recommendations error (using fallback):", error);
      res.json({
        user: {
          id: req.params.user_id,
          coin_balance: userPointsMap.has(req.params.user_id) ? userPointsMap.get(req.params.user_id) : 0
        },
        recommendations: [
          {
            id: "1",
            name: "Bakso Mas Yanto Spesial",
            price: 25000,
            category: "Bakso & Mie",
            image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400",
            description: "Bakso sapi asli ukuran jumbo dengan kuah kaldu sapi yang gurih, lengkap dengan mie dan sayur segar."
          },
          {
            id: "6",
            name: "Es Teller Mas Yanto",
            price: 15000,
            category: "Ice Cream",
            image_url: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=400",
            description: "Es campur segar dengan kelapa muda, nangka, alpukat, dan susu kental manis."
          }
        ]
      });
    }
  });

  app.get("/api/tangolab/users/scan-tag/:tag_id", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/v1/users/scan-tag/${req.params.tag_id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab scan-tag error (using fallback):", error);
      res.json({
        status: "success",
        user: {
          id: "U123",
          nama: "Reza",
          nim: "2024001",
          coin_balance: userPointsMap.has("U123") ? userPointsMap.get("U123") : 0,
          avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
          rfid_tag_id: req.params.tag_id
        }
      });
    }
  });

  app.post("/api/tangolab/users/login", async (req, res) => {
    const buildFallbackUser = (id: string) => ({
      status: "success",
      user: {
        id: id,
        nama: id,
        nim: id,
        coin_balance: userPointsMap.has(id) ? userPointsMap.get(id) : 0,
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        rfid_tag_id: "TAG12345"
      }
    });

    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();

      // If backend returns a valid user, use it
      if (data && (data.status === 'success' || data.user)) {
        res.status(response.status).json(data);
      } else {
        // Backend responded but user not found — use fallback for dev/testing
        console.warn("[PROXY] Tangolab user not found, using dev fallback for:", req.body.id);
        res.json(buildFallbackUser(req.body.id || "user"));
      }
    } catch (error) {
      // Network error — also fallback
      console.warn("Tangolab login error (using fallback):", error);
      res.json(buildFallbackUser(req.body.id || "user"));
    }
  });

  // GET all users — digunakan untuk validasi login berbasis NIM / User ID
  app.get("/api/tangolab/users", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/users`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab get-users error (using fallback):", error);
      // Fallback dummy users untuk dev/testing
      res.json([
        {
          id: "U123",
          nama: "NANDA",
          nim: "607012430009",
          coin_balance: 100,
          role: "Pelanggan"
        }
      ]);
    }
  });

  app.post("/api/tangolab/users/register", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab register error (using fallback):", error);
      res.json({
        status: "success",
        message: "User berhasil didaftarkan (Offline Mode)",
        user: {
          id: req.body.id || "U123",
          nama: req.body.nama || "User Baru",
          nim: req.body.nim || "2024000",
          coin_balance: 0,
          avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
        }
      });
    }
  });

  // Tangolab Point API
  app.post("/api/tangolab/users/:user_id/earn-coins", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/users/${req.params.user_id}/earn-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab earn-coins error (using fallback):", error);
      const current = userPointsMap.get(req.params.user_id) || 0;
      const amount = Number(req.body.amount || 0);
      const nextBal = current + amount;
      userPointsMap.set(req.params.user_id, nextBal);
      res.json({
        message: "Koin berhasil ditambahkan (Offline Mode)",
        new_balance: nextBal,
        transaction: {
          id: `tx-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: amount,
          type: "earn",
          description: req.body.description || "Earn coins",
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  app.get("/api/tangolab/users/transactions", async (req, res) => {
    try {
      const { user_id } = req.query;
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/users/transactions?user_id=${user_id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab transactions error (using fallback):", error);
      res.json({
        status: "success",
        transactions: [
          {
            id: "tx-1",
            amount: 50,
            type: "earn",
            description: "Registrasi Awal",
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            id: "tx-2",
            amount: 10,
            type: "earn",
            description: "Scan RFID",
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      });
    }
  });

  // Tangolab Voucher / Promo API
  app.get("/api/tangolab/coin-promos", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/coin-promos`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab coin-promos error (using fallback):", error);
      res.json([
        {
          id: "p1",
          name: "Voucher Diskon Rp 5.000",
          description: "Potongan langsung Rp 5.000 dengan koin",
          cost: 50,
          discount_price: 5000,
          expiry: "30 hari",
          color: "from-[#FF6B00] to-yellow-500",
          icon: "🎫"
        },
        {
          id: "p2",
          name: "Voucher Free Es Teh",
          description: "Gratis 1 Es Teh Manis",
          cost: 30,
          discount_price: 5000,
          expiry: "15 hari",
          color: "from-amber-400 to-orange-500",
          icon: "🧋"
        }
      ]);
    }
  });

  app.post("/api/tangolab/coin-promos/:promo_id/redeem", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/coin-promos/${req.params.promo_id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab redeem error (using fallback):", error);
      const current = userPointsMap.get(req.body.user_id) || 0;
      const nextBal = Math.max(0, current - 50); // simulate 50 coin cost
      userPointsMap.set(req.body.user_id, nextBal);
      res.json({
        status: "success",
        message: "Voucher berhasil ditukarkan (Offline Mode)",
        data: {
          voucher_code: `VCR-${Math.floor(10000 + Math.random() * 90000)}`,
          promo_id: req.params.promo_id || "p1",
          new_balance: nextBal
        }
      });
    }
  });

  app.post("/api/tangolab/coin-promos/claim-code", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/coin-promos/claim-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab claim-code error (using fallback):", error);
      res.json({
        status: "success",
        message: "Kode berhasil diklaim (Offline Mode)",
        data: {
          voucher_code: req.body.promo_code || "KODE-BARU",
        }
      });
    }
  });

  app.get("/api/tangolab/coin-promos/user-vouchers/:user_id", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/coin-promos/user-vouchers/${req.params.user_id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab user-vouchers error (using fallback):", error);
      res.json([
        {
          id: "vcr-tangolab-1",
          name: "Voucher Diskon Tangolab Rp 5.000",
          description: "Potongan Rp 5.000 dari penukaran koin",
          cost: 50,
          discount_price: 5000,
          expiry: "30 hari",
          color: "from-indigo-500 to-purple-600",
          icon: "🎫",
          claimedAt: new Date().toLocaleString('id-ID'),
          voucher_code: "TANGO5K",
          used: false
        }
      ]);
    }
  });

  app.post("/api/tangolab/coin-promos/validate-voucher", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/coin-promos/validate-voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab validate-voucher error (using fallback):", error);
      res.json({
        status: "valid",
        message: "Voucher valid (Offline Mode)",
        discount_amount: 5000,
        final_price: Math.max(0, req.body.total_price - 5000),
        discount: "Rp 5.000"
      });
    }
  });

  app.post("/api/tangolab/coin-promos/use-voucher", async (req, res) => {
    try {
      const response = await fetch(`${TANGOLAB_BASE_URL}/api/coin-promos/use-voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("Tangolab use-voucher error (using fallback):", error);
      res.json({
        status: "success",
        message: "Voucher berhasil digunakan (Offline Mode)"
      });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      console.log("Registering user via Kasir MySQL...");
      const response = await fetch(`${KASIR_DOMAIN}/api/register`, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        }
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn("Register Error (offline), falling back to dummy register:", error);
      res.json({
        success: true,
        message: "Registrasi berhasil (Offline Mode)",
        user: {
          id: req.body.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
          name: req.body.name || "Reza",
          email: req.body.email || "reza@gmail.com",
          role: "customer"
        }
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      console.log("Logging in user via Kasir MySQL...");
      const response = await fetch(`${KASIR_DOMAIN}/api/login`, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        }
      });

      const data = await response.json();
      console.log("[PROXY] Login Response from Kasir:", data);
      res.json(data);
    } catch (error) {
      console.warn("Login Error (offline), falling back to dummy login:", error);
      const id = req.body.id || "U123";
      res.json({
        success: true,
        message: "Login berhasil (Offline Mode)",
        user: {
          id: id,
          name: id === "U123" ? "Reza" : "Dummy Offline",
          email: "user@example.com",
          role: "customer"
        }
      });
    }
  });

  app.get("/api/ratings", async (req, res) => {
    try {
      const response = await fetch(`${KASIR_DOMAIN}/api/ratings`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn("Get Ratings Error (offline), returning empty list:", error);
      res.json([]);
    }
  });

  app.post("/api/ratings", async (req, res) => {
    try {
      const response = await fetch(`${KASIR_DOMAIN}/api/ratings`, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn("Submit Rating Error (offline), bypassing:", error);
      res.json({ success: true, message: "Ulasan disimpan secara lokal (Offline)" });
    }
  });

  app.get("/api/promos", async (req, res) => {
    try {
      console.log("[PROXY] Fetching promos from Kasir MySQL...");
      const response = await fetch(`${KASIR_DOMAIN}/api/promos`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "Authorization": req.headers.authorization || ""
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn("Get Promos Error (offline), using DUMMY_PROMOS:", error);
      res.json(DUMMY_PROMOS);
    }
  });

  app.get("/api/point-settings", async (req, res) => {
    try {
      console.log("[PROXY] Fetching point settings from Kasir MySQL...");
      const response = await fetch(`${KASIR_DOMAIN}/api/point-settings`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn("Get Point Settings Error (offline), using DUMMY_POINT_SETTINGS:", error);
      res.json(DUMMY_POINT_SETTINGS);
    }
  });

  app.get("/api/point-rewards", async (req, res) => {
    try {
      console.log("[PROXY] Fetching point rewards from Kasir MySQL...");
      const response = await fetch(`${KASIR_DOMAIN}/api/point-rewards`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "Authorization": req.headers.authorization || ""
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn("Get Point Rewards Error (offline), using DUMMY_POINT_REWARDS:", error);
      res.json(DUMMY_POINT_REWARDS);
    }
  });

  // Penukaran poin ke reward/voucher via KASIR API
  app.post("/api/point-rewards/:id/redeem", async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`[PROXY] Redeeming point reward ID ${id} for user...`);
      const response = await fetch(`${KASIR_DOMAIN}/api/point-rewards/${id}/redeem`, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "Authorization": req.headers.authorization || ""
        }
      });
      const data = await response.json();
      console.log(`[PROXY] Redeem response:`, data);
      res.status(response.status).json(data);
    } catch (error) {
      console.warn(`[PROXY] Gagal redeem point reward ${id}:`, error);
      res.status(500).json({ success: false, message: "Gagal menukarkan poin. Coba lagi." });
    }
  });

  // Cek status redeem per reward dari KASIR API
  app.get("/api/point-rewards/:id/redeem-status", async (req, res) => {
    const { id } = req.params;
    try {
      const response = await fetch(`${KASIR_DOMAIN}/api/point-rewards/${id}/redeem-status`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "Authorization": req.headers.authorization || ""
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn(`[PROXY] Gagal cek redeem-status untuk reward ${id}:`, error);
      res.json({ redeemed: false });
    }
  });


  app.get("/api/users/:id/points", async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`[PROXY] Fetching user points for ID ${id} from Kasir MySQL...`);
      const response = await fetch(`${KASIR_DOMAIN}/api/users/${id}/points`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "Authorization": req.headers.authorization || ""
        }
      });
      const data = await response.json();
      if (data && data.points !== undefined) {
        userPointsMap.set(id, data.points);
      }
      res.json(data);
    } catch (error) {
      console.warn(`[PROXY] Gagal mengambil poin untuk ${id}. Menggunakan fallback/memori dummy.`);
      if (!userPointsMap.has(id)) {
        userPointsMap.set(id, 0); // default fallback value
      }
      res.json({ success: true, points: userPointsMap.get(id) });
    }
  });

  app.post("/api/users/:id/points", async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    try {
      console.log(`[PROXY] Updating user points for ID ${id} via Kasir MySQL...`);
      const response = await fetch(`${KASIR_DOMAIN}/api/users/${id}/points`, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "Authorization": req.headers.authorization || ""
        }
      });
      const data = await response.json();
      if (data && data.points !== undefined) {
        userPointsMap.set(id, data.points);
      }
      res.json(data);
    } catch (error) {
      console.warn(`[PROXY] Gagal memperbarui poin untuk ${id}. Menggunakan update memori dummy.`);
      const current = userPointsMap.get(id) || 0;
      const nextPoints = current + Number(amount || 0);
      userPointsMap.set(id, nextPoints);
      res.json({ success: true, points: nextPoints });
    }
  });

  app.get("/api/users/:id/orders", async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`[PROXY] Fetching order history for user ID ${id} from Kasir MySQL...`);
      const response = await fetch(`${KASIR_DOMAIN}/api/users/${id}/orders`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "Authorization": req.headers.authorization || ""
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn(`[PROXY] Gagal mengambil riwayat pesanan untuk ${id}. Menggunakan fallback riwayat dummy.`);
      if (!userOrdersMap.has(id)) {
        const defaultOrders = id === "U123" ? [
          {
            id: "ORD-9821",
            customerName: "Reza",
            tableNumber: "Meja 5",
            paymentMethod: "QRIS",
            timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString('id-ID'), // 2 hours ago
            total: 40000,
            status: "SELESAI",
            pointsEarned: 40,
            items: [
              {
                id: "1",
                name: "Bakso Mas Yanto Spesial",
                price: 25000,
                category: "Bakso & Mie",
                quantity: 1,
                image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400",
                inStock: true
              },
              {
                id: "6",
                name: "Es Teller Mas Yanto",
                price: 15000,
                category: "Ice Cream",
                quantity: 1,
                image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=400",
                inStock: true
              }
            ]
          }
        ] : [];
        userOrdersMap.set(id, defaultOrders);
      }
      res.json(userOrdersMap.get(id));
    }
  });

  // Simulasi/Dummy Data jika backend kasir offline
  const DUMMY_MENU = [
    {
      id: 1,
      name: "Bakso Mas Yanto Spesial",
      price: 25000,
      category: "Bakso & Mie",
      image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400",
      status: "Tersedia",
      stock: 50,
      description: "Bakso sapi asli ukuran jumbo dengan kuah kaldu sapi yang gurih, lengkap dengan mie dan sayur segar.",
      displayed: 1
    },
    {
      id: 2,
      name: "Mie Ayam Pangsit",
      price: 18000,
      category: "Bakso & Mie",
      image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400",
      status: "Tersedia",
      stock: 30,
      description: "Mie ayam buatan sendiri dengan bumbu kecap manis gurih, ditambah pangsit basah yang lembut.",
      displayed: 1
    },
    {
      id: 3,
      name: "Nasi Goreng Spesial",
      price: 20000,
      category: "Aneka Nasi",
      image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400",
      status: "Tersedia",
      stock: 40,
      description: "Nasi goreng harum khas jawa dengan telur mata sapi, suwiran ayam, dan acar segar.",
      displayed: 1
    },
    {
      id: 4,
      name: "Nasi Bakar Ayam Suwir",
      price: 22000,
      category: "Aneka Nasi",
      image_url: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?q=80&w=400",
      status: "Tersedia",
      stock: 20,
      description: "Nasi gurih dibungkus daun pisang yang dibakar dengan isian ayam suwir kemangi pedas.",
      displayed: 1
    },
    {
      id: 5,
      name: "Batagor Bandung",
      price: 15000,
      category: "Gorengan",
      image_url: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=400",
      status: "Tersedia",
      stock: 60,
      description: "Bakso tahu goreng renyah disiram dengan saus kacang kental yang pedas manis.",
      displayed: 1
    },
    {
      id: 6,
      name: "Es Teller Mas Yanto",
      price: 15000,
      category: "Ice Cream",
      image_url: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=400",
      status: "Tersedia",
      stock: 35,
      description: "Es campur segar dengan kelapa muda, nangka, alpukat, dan susu kental manis.",
      displayed: 1
    },
    {
      id: 7,
      name: "Es Jeruk Peras",
      price: 8000,
      category: "Minuman",
      image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=400",
      status: "Tersedia",
      stock: 100,
      description: "Perasan jeruk asli segar yang kaya akan vitamin C dingin.",
      displayed: 1
    },
    {
      id: 8,
      name: "Teh Manis (Es / Hangat)",
      price: 5000,
      category: "Minuman",
      image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=400",
      status: "Tersedia",
      stock: 100,
      description: "Teh wangi melati pilihan dengan gula asli.",
      displayed: 1
    }
  ];

  const dummyOrders = new Map<string, { status: string; timestamp: number }>();

  app.post("/api/orders", async (req, res) => {
    try {
      console.log("Submitting order ke Kasir MySQL...");
      const response = await fetch(`${KASIR_DOMAIN}/api/orders`, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true" // Wajib ditambah agar tidak diblokir
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.warn("[PROXY] Gagal kirim pesanan ke Kasir. Menggunakan simulasi order dummy.");
      const orderId = req.body.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const customerId = req.body.customerId || "U123";

      const newOrder = {
        ...req.body,
        id: orderId,
      };

      if (!dummyOrders.has(orderId)) {
        dummyOrders.set(orderId, { status: req.body.status || "PENDING", timestamp: Date.now() });
        if (!userOrdersMap.has(customerId)) {
          userOrdersMap.set(customerId, []);
        }
        userOrdersMap.get(customerId)?.unshift(newOrder);

        // Simulasi transisi status pesanan
        setTimeout(() => {
          const order = dummyOrders.get(orderId);
          if (order) {
            order.status = "Diproses";
            console.log(`[SIMULASI] Status order ${orderId} berubah ke: Diproses`);
            const list = userOrdersMap.get(customerId) || [];
            const o = list.find(x => x.id === orderId);
            if (o) o.status = "DIPROSES";
          }
        }, 5000);

        setTimeout(() => {
          const order = dummyOrders.get(orderId);
          if (order) {
            order.status = "Siap Disajikan";
            console.log(`[SIMULASI] Status order ${orderId} berubah ke: Siap Disajikan`);
            const list = userOrdersMap.get(customerId) || [];
            const o = list.find(x => x.id === orderId);
            if (o) o.status = "SELESAI";
          }
        }, 12000);
      } else {
        // Update existing order (e.g. status, rating, review)
        const current = dummyOrders.get(orderId);
        if (current) {
          if (req.body.status) current.status = req.body.status;
        }
        const list = userOrdersMap.get(customerId) || [];
        const existingIdx = list.findIndex(x => x.id === orderId);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...req.body };
        }
      }

      res.json({ success: true, message: "Pesanan disimulasikan (Backend Offline)", orderId });
    }
  });

  app.post("/api/orders/:id/payment-proof", async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`[PROXY] Uploading payment proof for order ${id}...`);
      const response = await fetch(`${KASIR_DOMAIN}/api/orders/${id}/payment-proof`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Bypass-Tunnel-Reminder": "true",
          "content-type": req.headers["content-type"] as string
        },
        body: req,
        duplex: 'half'
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("[PROXY] Gagal upload bukti bayar:", error);
      res.status(500).json({ success: false, message: "Internal proxy error" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    const { id } = req.params;

    // Cek dulu apakah ada di memori dummyOrders
    if (dummyOrders.has(id)) {
      const order = dummyOrders.get(id);
      return res.json({ success: true, status: order?.status });
    }

    try {
      console.log(`[PROXY] Checking status for order: ${id}`);
      const response = await fetch(`${KASIR_DOMAIN}/api/orders/${id}`, {
        method: "GET",
        headers: {
          "bypass-tunnel-reminder": "true",
          "Bypass-Tunnel-Reminder": "true",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, message: "Gagal mengambil status pesanan" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.warn("[PROXY] Gagal cek status pesanan. Menggunakan fallback status dummy.");
      res.json({ success: true, status: "Siap Disajikan" });
    }
  });

  app.post("/api/scan", async (req, res) => {
    try {
      console.log("Tracking scan via GAS...");
      await fetch(`${APPS_SCRIPT_URL}?action=scan`, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        redirect: "follow"
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Scan Error:", error);
      res.status(500).json({ success: false });
    }
  });

  app.get("/api/menu", async (req, res) => {
    // Hindari loop rekursif jika server secara tidak sengaja memanggil dirinya sendiri
    if (req.headers["x-loop-prevent"] === "true") {
      console.warn("[PROXY] Loop terdeteksi dan dihentikan untuk request /api/menu");
      return res.json([]);
    }

    // Ambil menu dari NGOLAB Kasir dan AIR GESTURE secara paralel
    const fetchNgolab = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const fetchUrl = `${API_KASIR_URL}?_t=${Date.now()}`;
        console.log(`[PROXY] Mengambil menu NGOLAB dari: ${fetchUrl}`);
        const response = await fetch(fetchUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "bypass-tunnel-reminder": "true",
            "Bypass-Tunnel-Reminder": "true",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0",
            "X-Loop-Prevent": "true",
            "Cache-Control": "no-cache"
          }
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) throw new Error("Bukan JSON");
        const data = await response.json();
        console.log(`=== NGOLAB: ${data.length} menu diterima ===`);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`[PROXY] Gagal ambil menu NGOLAB: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    };

    const fetchAirGesture = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const url = `${AIRGESTURE_DOMAIN}/api/menu?outlet=coworking&_t=${Date.now()}`;
        console.log(`[PROXY] Mengambil menu AIR GESTURE dari: ${url}`);
        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
            "x-api-key": AIRGESTURE_API_KEY,
            "X-Loop-Prevent": "true",
            "Cache-Control": "no-cache"
          }
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        const rawData = Array.isArray(data) ? data : [];
        // Saring hanya menu yang berstatus ditampilkan (displayed === 1)
        const activeData = rawData.filter((item: any) => item.displayed === 1 || item.displayed === true || item.displayed === undefined);

        // Beri prefix 'ag-' pada ID agar tidak tabrakan dengan NGOLAB
        const mapped = activeData.map((item: any) => ({
          id: `ag-${item.id}`,
          name: item.name,
          price: item.price,
          category: item.category || "Main Course",
          image_url: (() => {
            const rawImg = item.image || item.image_url || "";
            if (!rawImg) return "";
            if (rawImg.startsWith("http")) return rawImg;
            if (rawImg.startsWith("/")) return `${AIRGESTURE_DOMAIN}${rawImg}`;
            return `${AIRGESTURE_DOMAIN}/${rawImg}`;
          })(),
          status: item.inStock ? "Tersedia" : "Habis",
          stock: item.stock || 0,
          description: item.description || item.deskripsi || "",
          displayed: 1,
          isAirGesture: true
        }));
        console.log(`=== AIR GESTURE: ${mapped.length} menu diterima ===`);
        return mapped;
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`[PROXY] Gagal ambil menu AIR GESTURE: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    };

    const [ngolabMenus, airGestureMenus] = await Promise.all([fetchNgolab(), fetchAirGesture()]);

    if (ngolabMenus.length === 0 && airGestureMenus.length === 0) {
      console.warn("[PROXY] Menggunakan DUMMY_MENU karena semua server menu offline.");
      return res.json(DUMMY_MENU);
    }

    res.json([...ngolabMenus, ...airGestureMenus]);
  });


  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`Server starting in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode`);

  if (!isProduction) {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    const { default: react } = await import('@vitejs/plugin-react');
    const vite = await createViteServer({
      configFile: false,
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { port: 24679 } : false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
