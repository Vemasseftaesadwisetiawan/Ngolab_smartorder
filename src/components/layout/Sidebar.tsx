import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ClipboardList, 
  History, 
  Users, 
  Settings, 
  BookOpen, 
  Package, 
  TicketPercent, 
  BarChart3,
  Star,
  Coins,
  Smartphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  QrCode,
  UserPlus,
  ShoppingCart,
  ChefHat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  userRole: string | null;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
  { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, roles: ['Admin', 'Staff Operasional'] },
  { id: 'kds', label: 'Kitchen System (KDS)', icon: ChefHat, roles: ['Admin', 'Staff Dapur'] },
  { id: 'orders', label: 'Pesanan Masuk', icon: ClipboardList, roles: ['Admin', 'Staff Operasional', 'Staff Dapur'] },
  { id: 'menu-catalog', label: 'Katalog Menu', icon: BookOpen, roles: ['Admin', 'Staff Operasional', 'Staff Dapur'] },
  { id: 'manage-menu', label: 'Kelola Menu', icon: UtensilsCrossed, roles: ['Admin'] },
  { id: 'manage-tables', label: 'Smart Tag / Meja', icon: QrCode, roles: ['Admin'] },
  { id: 'stock', label: 'Stok Bahan', icon: Package, roles: ['Admin', 'Staff Operasional'] },
  { id: 'history', label: 'Histori Transaksi', icon: History, roles: ['Admin'] },
  { id: 'promo', label: 'Kelola Promo', icon: TicketPercent, roles: ['Admin'] },
  { id: 'reports', label: 'Laporan Penjualan', icon: BarChart3, roles: ['Admin', 'Staff Operasional'] },
  { id: 'staff', label: 'Manajemen Staff', icon: UserPlus, roles: ['Admin'] },
  { id: 'ratings', label: 'Rating & Ulasan', icon: Star, roles: ['Admin'] },
  { id: 'points', label: 'Kelola Poin', icon: Coins, roles: ['Admin'] },
  { id: 'users', label: 'Kelola User', icon: Users, roles: ['Admin'] },
  { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['Admin'] },
];

export function Sidebar({ activePage, setActivePage, collapsed, setCollapsed, onLogout, userRole }: SidebarProps) {
  const filteredNavItems = navItems.filter(item => 
    !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <aside 
      className={cn(
        "flex flex-col border-r bg-stone-50 transition-all duration-300 ease-in-out print:hidden",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-3 font-bold text-stone-900">
            <img 
              src="/logo.png" 
              alt="Ngolab Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to text logo if image is missing
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs">
              NL
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">ngolab</span>
              <span className="text-[10px] text-stone-500 font-medium italic">Bakso Mas Yanto</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-8 h-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              NL
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {filteredNavItems.map((item) => (
            <Button
              key={item.id}
              variant={activePage === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                activePage === item.id ? "bg-orange-100 text-orange-900 hover:bg-orange-200" : "text-stone-600 hover:text-stone-900",
                collapsed && "justify-center px-0"
              )}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon size={20} className={cn(activePage === item.id ? "text-orange-600" : "text-stone-500")} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          onClick={onLogout}
          className={cn(
            "w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span>Keluar</span>}
        </Button>
      </div>
    </aside>
  );
}
