import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChefHat,
  MoreHorizontal,
  Printer,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  total: number;
  time: string;
  status: string;
}

interface OrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onUpdateStatus?: (id: string, status: string) => void;
  searchTerm?: string;
}

export function Orders({ orders, setOrders, onUpdateStatus, searchTerm = '' }: OrdersProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const handleProcessOrder = (id: string) => {
    if (onUpdateStatus) {
      onUpdateStatus(id, 'Sedang Disiapkan');
    } else {
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: 'Sedang Disiapkan' } : order
      ));
    }
    toast.info(`Pesanan ${id} mulai diproses`);
  };

  const handleCompleteOrder = (id: string) => {
    if (onUpdateStatus) {
      onUpdateStatus(id, 'Siap Disajikan');
    } else {
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: 'Siap Disajikan' } : order
      ));
    }
    toast.success(`Pesanan ${id} telah selesai!`);
  };

  const handlePrintReceipt = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan popup tidak diblokir.");
      return;
    }

    const itemsHtml = order.items.map(item => `
      <div style="display: flex; justify-between; margin-bottom: 5px;">
        <span style="flex: 1;">${item.quantity}x ${item.name}</span>
        <span>Rp ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pesanan - ${order.id}</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 300px; 
              margin: 0 auto; 
              padding: 20px;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; }
            .info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .items { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .total { font-weight: bold; display: flex; justify-content: space-between; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
            @media print {
              body { width: 100%; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SARIKAYO ONLINE</h1>
            <p>Struk Pesanan</p>
          </div>
          <div class="info">
            <div style="display: flex; justify-content: space-between;">
              <span>No. Pesanan:</span>
              <span>${order.id}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Meja:</span>
              <span>${order.table}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Waktu:</span>
              <span>${order.time}</span>
            </div>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>Rp ${order.total.toLocaleString()}</span>
          </div>
          <div class="footer">
            <p>Terima Kasih Atas Kunjungan Anda</p>
            <p>Selamat Menikmati!</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredOrders = (status: string) => {
    let baseOrders = orders;
    if (status !== 'all') {
      baseOrders = orders.filter(order => order.status === status);
    }
    
    if (!effectiveSearchTerm) return baseOrders;
    
    return baseOrders.filter(order => 
      order.table.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(effectiveSearchTerm.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <TabsList className="bg-stone-100 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-white">Semua</TabsTrigger>
                <TabsTrigger value="Menunggu" className="data-[state=active]:bg-white">Menunggu</TabsTrigger>
                <TabsTrigger value="Sedang Disiapkan" className="data-[state=active]:bg-white">Diproses</TabsTrigger>
                <TabsTrigger value="Siap Disajikan" className="data-[state=active]:bg-white">Siap Saji</TabsTrigger>
              </TabsList>
              
              <div className="hidden lg:flex items-center gap-2 text-sm text-stone-500">
                <Clock size={16} />
                Terakhir update: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="Cari meja atau ID..." 
                className="pl-10 bg-white border-stone-200"
                value={effectiveSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
            </div>
          </div>

        {['all', 'Menunggu', 'Sedang Disiapkan', 'Siap Disajikan'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders(tab).map((order) => (
                <Card key={order.id} className="border-none shadow-sm bg-white overflow-hidden">
                  <div className={cn(
                    "h-1 w-full",
                    order.status === 'Menunggu' ? "bg-orange-500" : 
                    order.status === 'Sedang Disiapkan' ? "bg-blue-500" : "bg-green-500"
                  )} />
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div>
                      <CardTitle className="text-lg">{order.table}</CardTitle>
                      <p className="text-xs text-stone-500 mt-1">{order.time}</p>
                    </div>
                    <Badge className={cn(
                      "font-normal border-none",
                      order.status === 'Menunggu' ? "bg-orange-100 text-orange-700" : 
                      order.status === 'Sedang Disiapkan' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    )}>
                      {order.status === 'Menunggu' ? 'Menunggu' : 
                       order.status === 'Sedang Disiapkan' ? 'Diproses' : 'Siap Saji'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-stone-600">
                            <span className="font-bold text-stone-900">{item.quantity}x</span> {item.name}
                          </span>
                          <span className="text-stone-400">Rp {(item.price || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t flex justify-between items-center">
                      <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Total</p>
                        <p className="text-lg font-bold text-stone-900">Rp {(order.total || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 border-stone-200"
                          onClick={() => handlePrintReceipt(order.id)}
                        >
                          <Printer size={16} />
                        </Button>
                        {order.status === 'Menunggu' && (
                          <Button 
                            className="h-9 bg-orange-600 hover:bg-orange-700 gap-2"
                            onClick={() => handleProcessOrder(order.id)}
                          >
                            <ChefHat size={16} /> Proses
                          </Button>
                        )}
                        {order.status === 'Sedang Disiapkan' && (
                          <Button 
                            className="h-9 bg-green-600 hover:bg-green-700 gap-2"
                            onClick={() => handleCompleteOrder(order.id)}
                          >
                            <CheckCircle2 size={16} /> Selesai
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredOrders(tab).length === 0 && (
                <div className="col-span-full py-12 text-center text-stone-400">
                  Tidak ada pesanan {tab !== 'all' ? tab : ''}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  </div>
  );
}

// Helper function for class names removed in favor of @/lib/utils
