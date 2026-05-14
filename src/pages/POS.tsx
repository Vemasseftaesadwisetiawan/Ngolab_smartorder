import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Banknote,
  ChevronRight,
  Filter,
  X,
  History,
  Trophy,
  Loader2,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Ingredient {
  stockId: string;
  amount: number;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  promoPrice?: number;
  status: string;
  stock: number;
  description: string;
  displayed: boolean;
  ingredients?: Ingredient[];
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}

interface POSProps {
  menuItems: MenuItem[];
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
  stockItems: any[];
  setStockItems: React.Dispatch<React.SetStateAction<any[]>>;
}

export function POS({ menuItems, setOrders, stockItems, setStockItems }: POSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Payment States
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');

  const categories = ['Semua', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const subtotal = cart.reduce((sum, item) => sum + ((item.promoPrice || item.price) * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const change = useMemo(() => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - total);
  }, [amountPaid, total]);

  const canFinishPayment = useMemo(() => {
    if (paymentMethod === 'QRIS') return true;
    if (paymentMethod === 'Cash') return (parseFloat(amountPaid) || 0) >= total;
    return false;
  }, [paymentMethod, amountPaid, total]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
      return matchesSearch && matchesCategory && item.displayed;
    });
  }, [menuItems, searchTerm, activeCategory]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, note: '' }];
    });
    toast.success(`${item.name} ditambahkan ke keranjang`);
  };

  const updateNote = (id: string, note: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, note } : i));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    setIsProcessing(true);

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      table: 'Take Away',
      customer: 'Customer Take Away',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.promoPrice || item.price,
        quantity: item.quantity,
        note: item.note
      })),
      total: total,
      paymentMethod,
      amountPaid: paymentMethod === 'Cash' ? parseFloat(amountPaid) : total,
      change: paymentMethod === 'Cash' ? change : 0,
      type: 'POS'
    };

    try {
      // 1. Kirim Pesanan ke Backend
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (!response.ok) throw new Error('Gagal memproses transaksi di server');

      // 2. Tambahkan ke state lokal agar langsung muncul di KDS & History
      const orderForUI = {
        ...newOrder,
        status: 'Menunggu',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('id-ID'),
      };
      setOrders(prev => [orderForUI, ...prev]);

      // 3. Reset form
      setCart([]);
      setShowPaymentDialog(false);
      setAmountPaid('');
      setPaymentMethod(null);
      toast.success('Transaksi berhasil diproses dan disimpan ke Database!');

    } catch (error) {
      toast.error("Terjadi kesalahan sistem saat menyimpan transaksi.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openPayment = (method: 'Cash' | 'QRIS') => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }
    setPaymentMethod(method);
    setAmountPaid(method === 'QRIS' ? total.toString() : '');
    setShowPaymentDialog(true);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Left Side: Product Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input 
              placeholder="Cari menu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-stone-200"
            />
          </div>
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-auto">
            <TabsList className="bg-stone-100 p-1">
              {categories.slice(0, 5).map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                className="group overflow-hidden border-none shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                onClick={() => addToCart(item)}
              >
                <div className="aspect-square bg-stone-100 relative overflow-hidden">
                  <img 
                    src={item.image || `https://picsum.photos/seed/${item.id}/400/400`} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {item.promoPrice ? (
                      <>
                        <Badge className="bg-orange-600 text-white border-none backdrop-blur-sm animate-pulse">
                          Rp {(item.promoPrice || 0).toLocaleString()}
                        </Badge>
                        <Badge variant="outline" className="bg-white/90 text-stone-400 border-none backdrop-blur-sm line-through text-[10px]">
                          Rp {(item.price || 0).toLocaleString()}
                        </Badge>
                      </>
                    ) : (
                      <Badge className="bg-white/90 text-stone-900 border-none backdrop-blur-sm">
                        Rp {(item.price || 0).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-bold text-stone-900 truncate">{item.name}</h3>
                  <p className="text-xs text-stone-500 mt-1">{item.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Side: Cart & Checkout */}
      <Card className="w-[400px] flex flex-col border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="border-b border-stone-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <ShoppingCart size={18} />
              </div>
              <CardTitle className="text-lg">Daftar Pesanan</CardTitle>
            </div>
            <Badge variant="outline" className="bg-stone-50 text-stone-600 border-stone-200">
              {cart.reduce((a, b) => a + b.quantity, 0)} Item
            </Badge>
          </div>
        </CardHeader>
        
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
          <div>
            <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Tipe Pesanan</label>
            <span className="text-sm font-bold text-stone-900 mt-1 block">🛍️ Take Away (Bungkus)</span>
          </div>
          <Badge className="bg-orange-600 text-white border-none shadow-sm">KASIR</Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 text-center">
                <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mb-4">
                  <ShoppingCart size={24} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Keranjang kosong</p>
                <p className="text-xs mt-1">Pilih menu di sebelah kiri untuk<br/>memulai pesanan</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-3 group">
                  <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                    <img src={item.image || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-stone-900 truncate">{item.name}</h4>
                    <p className="text-xs text-orange-600 font-bold mt-0.5">Rp {((item.promoPrice || item.price || 0) * item.quantity).toLocaleString()}</p>
                    
                    {/* Optional Note Input */}
                    <div className="mt-2">
                      <Input 
                        placeholder="Tambah catatan (opsional)..."
                        value={item.note || ''}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        className="h-7 text-[10px] bg-stone-50 border-stone-100 focus:ring-orange-500 py-1"
                      />
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center bg-stone-100 rounded-lg p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-stone-600 transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-stone-600 transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <CardFooter className="flex-col gap-4 p-6 bg-stone-50/50 border-t border-stone-100">
            <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span>
              <span>Rp {(subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-500">
              <span>Pajak (10%)</span>
              <span>Rp {(tax || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Total</span>
              <span className="text-orange-600">Rp {(total || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              variant="outline" 
              className="h-12 border-stone-200 hover:bg-stone-50 hover:border-orange-500 hover:text-orange-600 font-bold transition-all"
              onClick={() => openPayment('QRIS')}
              disabled={isProcessing || cart.length === 0}
            >
              <QrCode size={18} className="mr-2" />
              QRIS
            </Button>
            <Button 
              className="h-12 bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-lg transition-all"
              onClick={() => openPayment('Cash')}
              disabled={isProcessing || cart.length === 0}
            >
              <Banknote size={18} className="mr-2" />
              Tunai
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-stone-400 font-medium">
            Transaksi akan otomatis tercatat di laporan harian dan memotong stok inventory.
          </p>
        </CardFooter>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentMethod === 'Cash' ? <Banknote className="text-orange-600" /> : <QrCode className="text-orange-600" />}
              Pembayaran {paymentMethod === 'Cash' ? 'Tunai' : 'QRIS'}
            </DialogTitle>
            <DialogDescription>
              Selesaikan transaksi untuk pesanan Take Away
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-stone-500">Total Tagihan</span>
                <span className="text-lg font-bold text-stone-900">Rp {(total || 0).toLocaleString()}</span>
              </div>
            </div>

            {paymentMethod === 'Cash' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Uang Diterima</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Rp</span>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="pl-10 h-12 text-lg font-bold focus:ring-orange-500"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {[total, total + 5000, 50000, 100000].map(val => (
                    <Button 
                      key={val}
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => setAmountPaid(val.toString())}
                    >
                      {val.toLocaleString()}
                    </Button>
                  ))}
                </div>

                <div className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  (parseFloat(amountPaid) || 0) >= total 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-100"
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-600">Kembalian</span>
                    <span className={cn(
                      "text-xl font-bold",
                      (parseFloat(amountPaid) || 0) >= total ? "text-green-600" : "text-red-500"
                    )}>
                      Rp {change.toLocaleString()}
                    </span>
                  </div>
                  {(parseFloat(amountPaid) || 0) < total && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium italic">
                      * Uang tidak cukup
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-stone-100 rounded-2xl">
                <div className="w-48 h-48 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-200 mb-4">
                  <QrCode size={120} className="text-stone-300" />
                </div>
                <p className="text-sm font-bold text-stone-900">Scan QRIS Dinamis</p>
                <p className="text-xs text-stone-500 mt-1 text-center">Tunjukkan QR ke pelanggan untuk pembayaran otomatis</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPaymentDialog(false)}>Batal</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 shadow-lg shadow-orange-200"
              onClick={handleCheckout}
              disabled={isProcessing || !canFinishPayment}
            >
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
              Selesaikan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
