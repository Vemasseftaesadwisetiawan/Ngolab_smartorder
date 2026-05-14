import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Timer, 
  AlertCircle,
  Flame,
  Check,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
}

interface KDSProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}

export function KDS({ orders, setOrders, onUpdateStatus }: KDSProps) {
  const [filter, setFilter] = useState<'all' | 'Menunggu' | 'Sedang Disiapkan'>('Menunggu');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every 1s for accurate monitoring
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate waiting time
  const getTimeElapsed = (orderTime: string) => {
    if (!orderTime) return '-';
    try {
      const [hours, minutes] = orderTime.split(':').map(Number);
      const orderDate = new Date();
      orderDate.setHours(hours, minutes, 0);
      
      const diff = Math.floor((currentTime.getTime() - orderDate.getTime()) / 60000);
      if (diff < 0) return '0 m';
      return `${diff} m`;
    } catch (e) {
      return '-';
    }
  };

  const getCookingDuration = (startedAt?: string) => {
    if (!startedAt) return '0m 0s';
    const start = new Date(startedAt);
    const diffInSeconds = Math.floor((currentTime.getTime() - start.getTime()) / 1000);
    
    if (diffInSeconds < 0) return '0m 0s';
    
    const mins = Math.floor(diffInSeconds / 60);
    const secs = diffInSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getWaitSeverity = (orderTime: string) => {
    if (!orderTime) return 'normal';
    try {
      const [hours, minutes] = orderTime.split(':').map(Number);
      const orderDate = new Date();
      orderDate.setHours(hours, minutes, 0);
      const diff = (currentTime.getTime() - orderDate.getTime()) / 60000;
      
      if (diff >= 30) return 'critical';
      if (diff >= 15) return 'warning';
      return 'normal';
    } catch (e) {
      return 'normal';
    }
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
      toast.success(`Pesanan ${orderId} telah selesai dan siap!`);
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
        
        <div className="flex items-center justify-between sm:justify-end gap-1.5 p-1.5 bg-stone-100 rounded-2xl">
          <Button 
            variant={filter === 'all' ? 'secondary' : 'ghost'} 
            onClick={() => setFilter('all')}
            className={cn(
              "flex-1 sm:flex-initial h-12 sm:h-10 px-4 text-xs font-bold rounded-xl transition-all",
              filter === 'all' ? "bg-white shadow-sm text-stone-900" : "text-stone-500"
            )}
          >
            Semua
          </Button>
          <Button 
            variant={filter === 'Menunggu' ? 'secondary' : 'ghost'} 
            onClick={() => setFilter('Menunggu')}
            className={cn(
              "flex-1 sm:flex-initial h-12 sm:h-10 px-4 text-xs font-bold rounded-xl transition-all",
              filter === 'Menunggu' ? "bg-white shadow-sm text-stone-900" : "text-stone-500"
            )}
          >
            Baru
          </Button>
          <Button 
            variant={filter === 'Sedang Disiapkan' ? 'secondary' : 'ghost'} 
            onClick={() => setFilter('Sedang Disiapkan')}
            className={cn(
              "flex-1 sm:flex-initial h-12 sm:h-10 px-4 text-xs font-bold rounded-xl transition-all",
              filter === 'Sedang Disiapkan' ? "bg-white shadow-sm text-stone-900" : "text-stone-500"
            )}
          >
            Memasak
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-6">
          {activeOrders.map((order) => {
            const severity = getWaitSeverity(order.time);
            return (
              <Card key={order.id} className={cn(
                "flex flex-col border-none shadow-lg overflow-hidden transition-all duration-300 rounded-3xl",
                order.status === 'Sedang Disiapkan' ? "ring-4 ring-orange-500" : "ring-1 ring-stone-100",
                severity === 'critical' && order.status !== 'Sedang Disiapkan' ? "animate-pulse ring-4 ring-red-500" : ""
              )}>
                <CardHeader className={cn(
                  "p-5 flex flex-row items-center justify-between space-y-0",
                  order.status === 'Sedang Disiapkan' ? "bg-orange-500 text-white" : "bg-stone-900 text-white",
                  severity === 'critical' && order.status === 'Menunggu' ? "bg-red-600 text-white" : ""
                )}>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-black">{order.table || 'Walk-in'}</CardTitle>
                      <Badge variant="outline" className="bg-white/20 text-white border-transparent text-[10px] font-bold">
                        #{order.id.slice(-4)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold">
                      <Clock size={12} className="opacity-70" />
                      <span className="opacity-80">Sejak {order.time}</span>
                      {order.status === 'Sedang Disiapkan' ? (
                        <span className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/30 text-white">
                          <Flame size={10} className="animate-pulse" />
                          Cooking: {getCookingDuration(order.cookingStartedAt)}
                        </span>
                      ) : (
                        <span className={cn(
                          "ml-2 px-2 py-0.5 rounded-full",
                          severity === 'critical' ? 'bg-red-200 text-red-900' : 'bg-white/20'
                        )}>
                          Wait: {getTimeElapsed(order.time)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChefHat size={28} className="opacity-30" />
                </CardHeader>
                
                <CardContent className="flex-1 p-5">
                  <div className="space-y-5">
                    {order.items.map((item, idx) => (
                      <div key={`${order.id}-${idx}`} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <span className="font-black text-2xl text-stone-900 leading-none">{item.quantity}</span>
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-lg text-stone-800 leading-none">{item.name}</span>
                              {item.note && (
                                <div className="flex items-start gap-1.5 p-2 bg-red-50 rounded-xl border border-red-100">
                                  <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                                  <p className="text-xs text-red-900 font-black leading-tight uppercase italic">
                                    {item.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
  
                <Separator className="bg-stone-100 h-[2px]" />
  
                <CardFooter className="p-4 bg-stone-50 flex gap-3">
                  {order.status === 'Menunggu' ? (
                    <Button 
                      className="w-full h-16 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-lg font-black rounded-2xl gap-3 shadow-md shadow-orange-200 transition-all"
                      onClick={() => updateStatus(order.id, 'Sedang Disiapkan')}
                    >
                      <Flame size={24} />
                      MULAI MASAK
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-16 border-stone-200 text-stone-500 hover:bg-white active:scale-95 font-bold rounded-2xl shadow-sm transition-all"
                        onClick={() => updateStatus(order.id, 'Menunggu')}
                      >
                        <RotateCcw size={20} />
                      </Button>
                      <Button 
                        className="flex-[3] h-16 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-lg font-black rounded-2xl gap-3 shadow-md shadow-stone-200 transition-all"
                        onClick={() => updateStatus(order.id, 'Selesai')}
                      >
                        <CheckCircle2 size={24} />
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
