import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Timer, 
  AlertCircle,
  Flame,
  Check,
  RotateCcw,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn, playNotificationChime, playCallBellChime } from '@/lib/utils';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  note?: string;
}

interface Order {
  id: string;
  table: string;
  time: string;
  items: OrderItem[];
  status: 'Menunggu' | 'Sedang Disiapkan' | 'Selesai';
  type?: string;
  cookingStartedAt?: string;
  createdAt?: string;
}

interface KDSProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
}

export function KDS({ orders, setOrders, onUpdateStatus }: KDSProps) {
  const [filter, setFilter] = useState<'all' | 'Menunggu' | 'Sedang Disiapkan'>('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getWaitMinutes = (orderTime: string) => {
    if (!orderTime) return 0;
    try {
      let orderDate: Date;
      if (orderTime.includes('T') || orderTime.includes('-')) {
        orderDate = new Date(orderTime);
      } else {
        const parts = orderTime.split(/[:\.]/);
        if (parts.length < 2) return 0;
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        orderDate = new Date();
        orderDate.setHours(hours, minutes, 0);
      }
      const diff = Math.floor((now.getTime() - orderDate.getTime()) / 60000);
      return Math.max(0, diff);
    } catch (e) {
      return 0;
    }
  };

  const getWaitSeverity = (orderTime: string) => {
    const diff = getWaitMinutes(orderTime);
    if (diff >= 30) return 'critical';
    if (diff >= 15) return 'warning';
    return 'normal';
  };

  const getCookingDuration = (startedAt?: string) => {
    if (!startedAt) return '0m';
    const start = new Date(startedAt);
    if (isNaN(start.getTime())) return '0m';
    const diffInMinutes = Math.floor((Date.now() - start.getTime()) / 60000);
    if (diffInMinutes < 0) return '0m';
    return `${diffInMinutes} m`;
  };

  // Filter orders for KDS: only those that aren't finished or ready yet
  const activeOrders = orders.filter(order => {
    if (filter === 'Menunggu') return order.status === 'Menunggu';
    if (filter === 'Sedang Disiapkan') return order.status === 'Sedang Disiapkan';
    return order.status !== 'Selesai';
  });

  const updateStatus = (orderId: string, newStatus: Order['status']) => {
    onUpdateStatus(orderId, newStatus);
    
    if (newStatus === 'Sedang Disiapkan') {
      toast.info(`Pesanan ${orderId} mulai dimasak`);
    } else if (newStatus === 'Selesai') {
      playCallBellChime();
      toast.success(`🔔 Pesanan ${orderId} telah selesai dan siap disajikan!`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Menunggu': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Sedang Disiapkan': return 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
      {/* KDS Header / Statistics */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="grid grid-cols-2 gap-4 flex-1">
          <Card className="bg-white border-none shadow-sm h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Clock size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-stone-500 font-bold uppercase tracking-tight">Antrean Baru</p>
                <p className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                  {orders.filter(o => o.status === 'Menunggu').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <Flame size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-stone-500 font-bold uppercase tracking-tight">Sedang Dimasak</p>
                <p className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                  {orders.filter(o => o.status === 'Sedang Disiapkan').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders Grid */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            className="h-8 px-3 text-xs font-bold rounded-lg"
            onClick={() => setFilter('all')}
          >
            Semua
          </Button>
          <Button
            variant={filter === 'Menunggu' ? 'default' : 'outline'}
            className="h-8 px-3 text-xs font-bold rounded-lg"
            onClick={() => setFilter('Menunggu')}
          >
            Menunggu
          </Button>
          <Button
            variant={filter === 'Sedang Disiapkan' ? 'default' : 'outline'}
            className="h-8 px-3 text-xs font-bold rounded-lg"
            onClick={() => setFilter('Sedang Disiapkan')}
          >
            Sedang Dimasak
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-6">
          {activeOrders.map((order) => {
            const severity = getWaitSeverity(order.createdAt || order.time);
            const isCooking = order.status === 'Sedang Disiapkan';
            const isCritical = severity === 'critical';
            return (
              <Card key={order.id} className={cn(
                "flex flex-col bg-white border border-stone-200/80 shadow-sm overflow-hidden transition-all duration-300 rounded-2xl",
                isCooking && "border-orange-500/80 shadow-md shadow-orange-500/5",
                isCritical && order.status === 'Menunggu' && "border-red-500 shadow-md shadow-red-500/5 animate-pulse"
              )}>
                <CardHeader className={cn(
                  "p-4 flex flex-row items-center justify-between space-y-0 border-b border-stone-100",
                  isCooking ? "bg-orange-50/40" : "bg-stone-50/40",
                  isCritical && order.status === 'Menunggu' ? "bg-red-50/40" : ""
                )}>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-extrabold text-stone-900">{order.table || 'Walk-in'}</CardTitle>
                      <Badge variant="secondary" className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md border-none",
                        isCooking ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-700",
                        isCritical && order.status === 'Menunggu' ? "bg-red-100 text-red-700" : ""
                      )}>
                        #{order.id.slice(-4)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-500 font-medium">
                      <Clock size={12} className="opacity-80" />
                      <span>{order.time ? String(order.time).slice(0, 5) : '-'}</span>
                    </div>
                  </div>
                  <ChefHat size={20} className={cn(
                    "opacity-40",
                    isCooking ? "text-orange-600" : "text-stone-400"
                  )} />
                </CardHeader>
                
                <CardContent className="flex-1 p-4">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={`${order.id}-${idx}`} className="space-y-1">
                        <div className="flex items-start gap-2.5">
                          <span className="flex items-center justify-center font-extrabold text-sm text-stone-900 bg-stone-100 w-6 h-6 rounded-md shrink-0">
                            {item.quantity}x
                          </span>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-semibold text-sm text-stone-800 break-words leading-tight">{item.name}</span>
                            {item.note && (
                              <div className="flex items-start gap-1 p-1.5 bg-rose-50 rounded-lg border border-rose-100">
                                <AlertCircle size={12} className="text-rose-600 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-rose-800 font-bold leading-tight uppercase italic">
                                  {item.note}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
  
                <Separator className="bg-stone-100" />
  
                <CardFooter className="p-3 bg-stone-50/50 flex gap-2">
                  {order.status === 'Menunggu' ? (
                    <Button 
                      className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl gap-2 shadow-sm transition-all"
                      onClick={() => updateStatus(order.id, 'Sedang Disiapkan')}
                    >
                      <Flame size={14} />
                      MULAI MASAK
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-11 border-stone-200 text-stone-500 hover:bg-white font-bold rounded-xl shadow-sm transition-all"
                        onClick={() => updateStatus(order.id, 'Menunggu')}
                      >
                        <RotateCcw size={14} />
                      </Button>
                      <Button 
                        className="flex-[3] h-11 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl gap-2 shadow-sm transition-all"
                        onClick={() => updateStatus(order.id, 'Selesai')}
                      >
                        <CheckCircle2 size={14} />
                        SELESAI
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}

          {activeOrders.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mb-4">
                <ChefHat size={32} className="opacity-20" />
              </div>
              <p className="font-bold">Tidak ada antrean pesanan</p>
              <p className="text-xs">Dapur sedang santai, semua pesanan sudah diproses.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
