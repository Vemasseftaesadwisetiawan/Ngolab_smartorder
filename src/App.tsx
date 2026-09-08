'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Dashboard } from '@/pages/Dashboard';
import { POS } from '@/pages/POS';
import { KDS } from '@/pages/KDS';
import { MenuCatalog } from '@/pages/MenuCatalog';
import { ManageMenu } from '@/pages/ManageMenu';
import { TableManagement } from '@/pages/TableManagement';
import { StockManagement } from '@/pages/StockManagement';
import { RecipeManagement } from '@/pages/RecipeManagement';
import { TransactionHistory } from '@/pages/TransactionHistory';
import { PromoManagement } from '@/pages/PromoManagement';
import { SalesReport } from '@/pages/SalesReport';
import { UserManagement } from '@/pages/UserManagement';
import { RatingManagement } from '@/pages/RatingManagement';
import { PointsManagement } from '@/pages/PointsManagement';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { RatingInput } from '@/pages/RatingInput';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { playNotificationChime } from '@/lib/utils';
import { apiFetch, clearAuthToken, getApiBaseUrl } from '@/lib/apiFetch';
import { CustomerView } from '@/pages/CustomerView';

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
  const [promos, setPromos] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState(initialStock);

  // Helper to refresh menu items from API
  const refreshMenu = () => {
    apiFetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.length > 0) {
          const baseUrl = getApiBaseUrl();
          const menuDariDatabase = data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            category: item.category,
            price: Number(item.price),
            status: item.status,
            stock: item.stock,
            displayed: item.displayed !== undefined ? Boolean(item.displayed) : true,
            description: item.description || '',
            promoPrice: item.promoPrice ? Number(item.promoPrice) : undefined,
            image: item.image_url ? `${window.location.origin}${item.image_url}` : `https://picsum.photos/seed/${item.id}/300/300`,
            ingredients: (item.ingredients || []).map((ing: any) => ({
              ...ing,
              stockId: String(ing.stockId)
            })),
            availability_type: item.availability_type || 'permanent',
            available_from: item.available_from || undefined,
            available_to: item.available_to || undefined
          }));
          setMenuItems(menuDariDatabase);
        }
      })
      .catch(err => console.error("Gagal memanggil API Menu.", err));
  };

  // Helper to refresh stock items from API
  const refreshStock = () => {
    apiFetch('/api/stock')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          const mapped = data.map((item: any) => ({
            ...item,
            id: String(item.id)
          }));
          setStockItems(mapped);
        }
      })
      .catch(err => console.error("Gagal memanggil API Stok.", err));
  };

  // Ambil Data Menu dari Database MySQL (Backend) saat aplikasi pertama dimuat
  useEffect(() => {
    refreshMenu();
    refreshStock();

    // Ambil Data Akun Pengguna (Users)
    apiFetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUsers(data);
        }
      })
      .catch(err => console.error("Gagal memanggil API Users.", err));

    // Ambil Data Promo (Promos)
    apiFetch('/api/promos')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setPromos(data);
        } else {
          setPromos(initialPromos);
        }
      })
      .catch(err => {
        console.error("Gagal memanggil API Promos.", err);
        setPromos(initialPromos);
      });

  }, []);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Polling Data Transaksi (Orders) secara berkala (tiap 3 detik) untuk Notifikasi Lonceng KDS
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiFetch('/api/orders');
        const data = await res.json();
        if (data && !data.error) {
          if (isInitialLoadRef.current) {
            const initialIds = new Set(data.map((o: any) => String(o.id)));
            knownOrderIdsRef.current = initialIds;
            isInitialLoadRef.current = false;
            setOrders(data);
          } else {
            let hasNewOrder = false;
            let newestOrder: any = null;

            data.forEach((order: any) => {
              const orderIdStr = String(order.id);
              if (!knownOrderIdsRef.current.has(orderIdStr)) {
                knownOrderIdsRef.current.add(orderIdStr);
                if (order.status === 'Menunggu') {
                  hasNewOrder = true;
                  newestOrder = order;
                }
              }
            });

            setOrders(data);

            if (hasNewOrder && newestOrder) {
              playNotificationChime();
              toast.success(`🔔 Pesanan Baru Masuk! #${newestOrder.id}`, {
                description: `Meja: ${newestOrder.table || 'Walk-in'} | Rincian: ${newestOrder.items?.length || 0} item`,
                duration: 8000,
              });
              refreshMenu();
              refreshStock();
            }
          }
        }
      } catch (err) {
        console.error("Gagal memanggil API Orders.", err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Logic Update Status Pesanan ke Backend
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Gagal update status');
      
      // Update state lokal agar UI langsung berubah
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
              }
            : order
        );
        return updatedOrders;
      });
    } catch (err) {
      console.error("Gagal mengupdate status pesanan:", err);
    }
  };

  const handleVerifyPaymentProof = async (orderId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/payment-proof/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Gagal update verifikasi');
      
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              paymentProofStatus: status,
              status: status === 'approved' ? 'Selesai' : order.status
            }
          : order
      ));
      
      toast.success(status === 'approved' ? 'Bukti pembayaran disetujui' : 'Bukti pembayaran ditolak');
    } catch (err) {
      console.error("Gagal verifikasi bukti pembayaran:", err);
      toast.error("Gagal memverifikasi bukti pembayaran");
    }
  };

  // Reset search when page changes
  useEffect(() => {
    setGlobalSearchTerm('');
  }, [activePage]);

  const handleLogin = (role: string) => {
    console.log('handleLogin called with role:', role);
    setIsAuthenticated(true);
    setUserRole(role);
    // Simpan sesi ke memori browser agar tidak hilang saat di-refresh
    localStorage.setItem('smartorder_auth', 'true');
    localStorage.setItem('smartorder_role', role);
    console.log('Saved to localStorage:', localStorage.getItem('smartorder_role'));

    // Role-specific landing page
    if (role === 'Kasir') {
      setActivePage('pos');
    } else if (role === 'Koki') {
      setActivePage('kds');
    } else if (role === 'Admin') {
      setActivePage('dashboard');
    } else {
      setActivePage('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    clearAuthToken();
    localStorage.removeItem('smartorder_auth');
    localStorage.removeItem('smartorder_role');
  };

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard': return 'Dashboard';
      case 'menu-catalog': return 'Katalog Menu';
      case 'manage-menu': return 'Kelola Menu';
      case 'recipe': return 'Kelola Resep';
      case 'manage-tables': return 'Smart Tag / Meja';
      case 'stock': return 'Stok Bahan Baku';
      case 'history': return 'Histori Transaksi';
      case 'promo': return 'Kelola Promo';
      case 'reports': return 'Laporan Penjualan';
      case 'users': return 'Kelola User';
      case 'points': return 'Kelola Poin & Rewards';
      case 'ratings': return 'Rating & Ulasan';
      case 'settings': return 'Pengaturan Umum';
      default: return 'Dashboard';
    }
  };

  if (window.location.pathname === '/ratings-input') {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen bg-stone-50 overflow-hidden text-stone-900 font-sans">
          <RatingInput />
          <Toaster position="top-right" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
                  onVerifyPaymentProof={handleVerifyPaymentProof}
                  userRole={userRole}
                  refreshMenu={refreshMenu}
                />
              </div>
            </main>
          </div>
        </>
      )}
      <Toaster position="top-right" />
      </div>
    </ThemeProvider>
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
  onVerifyPaymentProof,
  userRole,
  refreshMenu
}: any) {
  // Access Control Logic
  const canAccess = (roles: string[]) => {
  if (!userRole) return false;
  if (userRole === 'Admin') return true;
  return roles.includes(userRole);
};

  switch (page) {
    case 'dashboard': 
      return canAccess(['Admin', 'Kasir', 'Koki']) ? <Dashboard menuItems={menuItems} orders={orders} stockItems={stockItems} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'pos':
      return canAccess(['Admin', 'Kasir']) ? <POS menuItems={menuItems} setMenuItems={setMenuItems} setOrders={setOrders} stockItems={stockItems} setStockItems={setStockItems} /> : <div className="text-center py-20 text-stone-500">Akses Terminal POS hanya untuk Kasir.</div>;
    case 'kds':
      return canAccess(['Admin', 'Koki']) ? <KDS orders={orders} setOrders={setOrders} onUpdateStatus={onUpdateStatus} /> : <div className="text-center py-20 text-stone-500">Akses KDS hanya untuk Koki.</div>;
    case 'menu-catalog': 
      return <MenuCatalog menuItems={menuItems} setMenuItems={setMenuItems} searchTerm={searchTerm} userRole={userRole} />;
    case 'manage-menu': 
      return canAccess(['Admin']) ? <ManageMenu menuItems={menuItems} setMenuItems={setMenuItems} stockItems={stockItems} searchTerm={searchTerm} /> : <MenuCatalog menuItems={menuItems} setMenuItems={setMenuItems} searchTerm={searchTerm} userRole={userRole} />;
    case 'recipe':
      return canAccess(['Admin', 'Koki']) ? <RecipeManagement menuItems={menuItems} setMenuItems={setMenuItems} stockItems={stockItems} searchTerm={searchTerm} refreshMenu={refreshMenu} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'manage-tables':
      return canAccess(['Admin']) ? <TableManagement /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'stock': 
      return canAccess(['Admin', 'Kasir', 'Koki']) ? <StockManagement stockItems={stockItems} setStockItems={setStockItems} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'history': 
      return canAccess(['Admin', 'Kasir', 'Koki']) ? <TransactionHistory orders={orders} searchTerm={searchTerm} onVerifyPaymentProof={onVerifyPaymentProof} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'promo': 
      return canAccess(['Admin']) ? <PromoManagement promos={promos} setPromos={setPromos} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'reports': 
      return canAccess(['Admin', 'Kasir', 'Koki']) ? <SalesReport orders={orders} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'users': 
      return canAccess(['Admin']) ? <UserManagement users={users} setUsers={setUsers} searchTerm={searchTerm} /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'points':
      return canAccess(['Admin']) ? <PointsManagement /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'ratings':
      return canAccess(['Admin', 'Kasir', 'Koki']) ? <RatingManagement /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    case 'settings': 
      return canAccess(['Admin']) ? <Settings /> : <div className="text-center py-20 text-stone-500">Anda tidak memiliki akses ke halaman ini.</div>;
    default: 
      return <Dashboard menuItems={menuItems} orders={orders} stockItems={stockItems} />;
  }
}
