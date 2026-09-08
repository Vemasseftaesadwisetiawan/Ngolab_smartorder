import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
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
  ShoppingCart,
  ChefHat,
  CookingPot
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
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Kasir', 'Koki'] },
  { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, roles: ['Admin', 'Kasir'] },
  { id: 'kds', label: 'Kitchen System (KDS)', icon: ChefHat, roles: ['Admin', 'Koki'] },
  { id: 'menu-catalog', label: 'Katalog Menu', icon: BookOpen, roles: ['Admin', 'Kasir', 'Koki'] },
  { id: 'manage-menu', label: 'Kelola Menu', icon: UtensilsCrossed, roles: ['Admin'] },
  { id: 'recipe', label: 'Kelola Resep', icon: CookingPot, roles: ['Admin', 'Koki'] },
  { id: 'manage-tables', label: 'Smart Tag / Meja', icon: QrCode, roles: ['Admin'] },
  { id: 'stock', label: 'Stok Bahan', icon: Package, roles: ['Admin', 'Kasir', 'Koki'] },
  { id: 'history', label: 'Histori Transaksi', icon: History, roles: ['Admin', 'Kasir', 'Koki'] },
  { id: 'promo', label: 'Kelola Promo', icon: TicketPercent, roles: ['Admin'] },
  { id: 'reports', label: 'Laporan Penjualan', icon: BarChart3, roles: ['Admin', 'Kasir', 'Koki'] },
  { id: 'ratings', label: 'Rating & Ulasan', icon: Star, roles: ['Admin', 'Kasir', 'Koki'] },
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
        "flex flex-col border-r bg-neutral-900 text-neutral-300 transition-all duration-300 ease-in-out print:hidden z-20",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-neutral-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5 font-bold text-white">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
              NL
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-white">ngolab</span>
              <span className="text-[10px] text-neutral-400 font-medium">Smart Order</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-[10px]">
              NL
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-0.5 px-2.5">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 font-medium py-2 px-2.5 h-auto rounded-lg transition-colors",
                  isActive 
                    ? "bg-orange-600 text-white" 
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800",
                  collapsed && "justify-center px-0 py-2"
                )}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={18} className={cn(
                  "flex-shrink-0",
                  isActive ? "text-white" : "text-neutral-400"
                )} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-neutral-800">
        <Button 
          variant="ghost" 
          onClick={onLogout}
          className={cn(
            "w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors py-2 h-auto rounded-lg",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Keluar</span>}
        </Button>
      </div>
    </aside>
  );
}
