import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { POS } from '@/pages/POS';
import { KDS } from '@/pages/KDS';
import { Orders } from '@/pages/Orders';
import { MenuCatalog } from '@/pages/MenuCatalog';
import { ManageMenu } from '@/pages/ManageMenu';
import { TableManagement } from '@/pages/TableManagement';
import { StockManagement } from '@/pages/StockManagement';
import { TransactionHistory } from '@/pages/TransactionHistory';
import { PromoManagement } from '@/pages/PromoManagement';
import { SalesReport } from '@/pages/SalesReport';
import { StaffManagement } from '@/pages/StaffManagement';
import { UserManagement } from '@/pages/UserManagement';
import { RatingManagement } from '@/pages/RatingManagement';
import { PointsManagement } from '@/pages/PointsManagement';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { Toaster } from '@/components/ui/sonner';

// Initial Data
// Data menu awal sekarang kosong karena langsung mengambil dari Database MySQL
const initialMenu: any[] = [];

const initialOrders: any[] = [];

const initialUsers: any[] = [];

const initialPromos = [
  { 
    id: '1', 
    title: 'Promo Ramadhan Berkah', 
    code: 'RAMADHAN20', 
    discount: '20%', 
    type: 'Percentage', 
    period: '2024-03-10 - 2024-04-10', 
    status: 'Active', 
    usageCount: 124, 
    maxUsage: 500, 
    minPurchase: 50000 
  },
  { 
    id: '2', 
    title: 'Diskon Pelajar', 
    code: 'PELAJAR5K', 
    discount: 'Rp 5.000', 
    type: 'Fixed', 
    period: '2024-01-01 - 2025-12-31', 
    status: 'Active', 
    usageCount: 850, 
    maxUsage: null, 
    minPurchase: 20000 
  },
];

const initialStock: any[] = [];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('smartorder_auth') === 'true';
  });
  const [userRole, setUserRole] = useState<string | null>(() => {
    return localStorage.getItem('smartorder_role');
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  
  // Global State
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState(initialOrders);
  const [users, setUsers] = useState(initialUsers);
  const [promos, setPromos] = useState(initialPromos);
  const [stockItems, setStockItems] = useState(initialStock);

  // Ambil Data Menu dari Database MySQL (Backend) saat aplikasi pertama dimuat
  useEffect(() => {
    fetch('http://localhost:5000/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.length > 0) {
          const menuDariDatabase = data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            category: item.category,
            price: Number(item.price),
            status: item.status,
            stock: item.stock,
            displayed: item.displayed !== undefined ? Boolean(item.displayed) : true,
            description: item.description || '',
            // Jika ada foto dari database, tambahkan alamat server localhost:5000 di depannya
            image: item.image_url ? `http://localhost:5000${item.image_url}` : `https://picsum.photos/seed/${item.id}/300/300`,
            ingredients: item.ingredients || [] // Sekarang mengambil resep dari DB
          }));
          setMenuItems(menuDariDatabase);
        }
      })
      .catch(err => {
        console.error("Gagal memanggil API Menu.", err);
      });

    // Ambil Data Transaksi (Orders)
    fetch('http://localhost:5000/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setOrders(data);
        }
      })
      .catch(err => console.error("Gagal memanggil API Orders.", err));

    // Ambil Data Stok Bahan Baku
    fetch('http://localhost:5000/api/stock')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStockItems(data);
        }
      })
      .catch(err => console.error("Gagal memanggil API Stok.", err));

    // Ambil Data Akun Pengguna (Users)
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUsers(data);
        }
      })
      .catch(err => console.error("Gagal memanggil API Users.", err));

  }, []);

  // Logic Update Status Pesanan ke Backend
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Gagal update status');
      
      // Update state lokal agar UI langsung berubah
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        );
        return updatedOrders;
      });
    } catch (err) {
      console.error("Gagal mengupdate status pesanan:", err);
    }
  };

  // Reset search when page changes
  useEffect(() => {
    setGlobalSearchTerm('');
  }, [activePage]);

  const handleLogin = (role: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    // Simpan sesi ke memori browser agar tidak hilang saat di-refresh
    localStorage.setItem('smartorder_auth', 'true');
    localStorage.setItem('smartorder_role', role);

    // Role-specific landing page
    if (role === 'Staff Operasional') {
      setActivePage('pos');
    } else if (role === 'Staff Dapur') {
      setActivePage('kds');
    } else {
      setActivePage('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    // Hapus sesi saat logout
    localStorage.removeItem('smartorder_auth');
    localStorage.removeItem('smartorder_role');
  };

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard': return 'Dashboard';
      case 'orders': return 'Pesanan Masuk';
      case 'menu-catalog': return 'Katalog Menu';
      case 'manage-menu': return 'Kelola Menu';
      case 'manage-tables': return 'Smart Tag / Meja';
      case 'stock': return 'Stok Bahan Baku';
      case 'history': return 'Histori Transaksi';
      case 'promo': return 'Kelola Promo';
      case 'reports': return 'Laporan Penjualan';
      case 'staff': return 'Manajemen Staff';
      case 'users': return 'Kelola User';
      case 'points': return 'Kelola Poin & Rewards';
      case 'ratings': return 'Rating & Ulasan';
      case 'settings': return 'Pengaturan Umum';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden text-stone-900 font-sans">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <Sidebar 
            activePage={activePage} 
            setActivePage={setActivePage} 
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            onLogout={handleLogout}
            userRole={userRole}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              title={getPageTitle(activePage)} 
              searchTerm={globalSearchTerm}
              setSearchTerm={setGlobalSearchTerm}
              userRole={userRole}
            />
            
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                <MainContent 
                  page={activePage}
                  menuItems={menuItems}
                  setMenuItems={setMenuItems}
                  orders={orders}
                  setOrders={setOrders}
                  stockItems={stockItems}
                  setStockItems={setStockItems}
                  promos={promos}
                  setPromos={setPromos}
                  users={users}
                  setUsers={setUsers}
                  searchTerm={globalSearchTerm}
                  onUpdateStatus={handleUpdateOrderStatus}
                  userRole={userRole}
                />
              </div>
            </main>
          </div>
        </>
      )}
      <Toaster position="top-right" />
    </div>
  );
}

// Separate component for page rendering to ensure clean hook boundaries
function MainContent({ 
  page, 
  menuItems, 
  setMenuItems, 
  orders, 
  setOrders, 
  stockItems, 
  setStockItems, 
  promos, 
  setPromos, 
  users, 
  setUsers, 
  searchTerm, 
  onUpdateStatus,
  userRole
}: any) {
  // Access Control Logic
  const canAccess = (roles: string[]) => userRole && roles.includes(userRole);

  switch (page) {
    case 'dashboard': 
      return canAccess(['Admin']) ? <Dashboard menuItems={menuItems} orders={orders} stockItems={stockItems} /> : <Orders orders={orders} setOrders={setOrders} onUpdateStatus={onUpdateStatus} searchTerm={searchTerm} />;
    case 'pos':
      return canAccess(['Admin', 'Staff Operasional']) ? <POS menuItems={menuItems} setOrders={setOrders} stockItems={stockItems} setStockItems={setStockItems} /> : <div className="text-center py-20 text-stone-500">Akses Terminal POS hanya untuk Staff Operasional.</div>;
    case 'kds':
      return canAccess(['Admin', 'Staff Dapur']) ? <KDS orders={orders} setOrders={setOrders} onUpdateStatus={onUpdateStatus} /> : <div className="text-center py-20 text-stone-500">Akses KDS hanya untuk Staff Dapur.</div>;
    case 'orders': 
      return canAccess(['Admin', 'Staff Operasional', 'Staff Dapur']) ? <Orders orders={orders} setOrders={setOrders} onUpdateStatus={onUpdateStatus} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Akses dibatasi.</div>;
    case 'menu-catalog': 
      return <MenuCatalog menuItems={menuItems} setMenuItems={setMenuItems} searchTerm={searchTerm} userRole={userRole} />;
    case 'manage-menu': 
      return canAccess(['Admin']) ? <ManageMenu menuItems={menuItems} setMenuItems={setMenuItems} stockItems={stockItems} searchTerm={searchTerm} /> : <MenuCatalog menuItems={menuItems} setMenuItems={setMenuItems} searchTerm={searchTerm} userRole={userRole} />;
    case 'manage-tables':
      return canAccess(['Admin']) ? <TableManagement /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'staff':
      return canAccess(['Admin']) ? <StaffManagement /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'stock': 
      return canAccess(['Admin', 'Staff Operasional']) ? <StockManagement stockItems={stockItems} setStockItems={setStockItems} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'history': 
      return canAccess(['Admin']) ? <TransactionHistory orders={orders} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'promo': 
      return canAccess(['Admin']) ? <PromoManagement promos={promos} setPromos={setPromos} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'reports': 
      return canAccess(['Admin', 'Staff Operasional']) ? <SalesReport orders={orders} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'users': 
      return canAccess(['Admin']) ? <UserManagement users={users} setUsers={setUsers} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'points':
      return canAccess(['Admin']) ? <PointsManagement /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'ratings':
      return canAccess(['Admin']) ? <RatingManagement /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'settings': 
      return canAccess(['Admin']) ? <Settings /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    default: 
      return <Dashboard menuItems={menuItems} orders={orders} stockItems={stockItems} />;
  }
}
