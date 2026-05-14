import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Star, 
  Eye, 
  EyeOff, 
  Search, 
  TicketPercent, 
  Plus, 
  Calendar, 
  Copy, 
  MoreVertical,
  Trash2,
  Edit2,
  Tag,
  Flame,
  Percent,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  promoPrice?: number;
  status: string;
  stock: number;
  description: string;
  image?: string;
  rating?: number;
  reviews?: number;
  displayed?: boolean;
}

interface MenuCatalogProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  searchTerm?: string;
  userRole?: string | null;
}

export function MenuCatalog({ 
  menuItems, 
  setMenuItems, 
  searchTerm = '', 
  userRole 
}: MenuCatalogProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'promo'>('menu');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const isAdmin = userRole === 'Admin' || userRole === 'Owner' || userRole === 'Manager';
  const isStaff = userRole === 'Staff' || userRole === 'Staff Dapur' || userRole === 'Staff Operasional';

  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [selectedItemForPromo, setSelectedItemForPromo] = useState<MenuItem | null>(null);
  const [promoPriceInput, setPromoPriceInput] = useState('');

  const handleUpdatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForPromo) return;

    const newPromoPrice = Number(promoPriceInput);
    if (isNaN(newPromoPrice) || newPromoPrice <= 0) {
      toast.error("Harga promo tidak valid");
      return;
    }

    if (newPromoPrice >= selectedItemForPromo.price) {
      toast.error("Harga promo harus lebih murah dari harga normal");
      return;
    }

    setMenuItems(prev => prev.map(item => 
      item.id === selectedItemForPromo.id ? { ...item, promoPrice: newPromoPrice } : item
    ));

    toast.success(`Promo untuk ${selectedItemForPromo.name} berhasil diatur!`);
    setIsPromoDialogOpen(false);
    setSelectedItemForPromo(null);
    setPromoPriceInput('');
  };

  const removePromo = (id: string, name: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, promoPrice: undefined } : item
    ));
    toast.info(`Promo untuk ${name} telah dihapus`);
  };

  const toggleDisplay = async (id: string) => {
    if (userRole === 'Staff Dapur' || userRole === 'Staff Operasional') {
      toast.error('Gunakan mode Admin untuk mengubah tampilan menu.');
      return;
    }
    
    const itemToToggle = menuItems.find(i => i.id === id);
    if (!itemToToggle) return;
    
    const newState = !itemToToggle.displayed;

    try {
      const response = await fetch(`http://localhost:5000/api/menu/${id}/display`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayed: newState })
      });
      
      if (!response.ok) throw new Error('Gagal update ke server');

      setMenuItems(prev => prev.map(item => 
        item.id === id ? { ...item, displayed: newState } : item
      ));
      toast.success(`${itemToToggle.name} ${newState ? 'akan' : 'tidak akan'} ditampilkan di sisi pengguna`);
    } catch (err) {
      toast.error('Gagal menyimpan perubahan ke database MySQL. Pastikan tabel memiliki kolom displayed.');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const itemsOnPromo = menuItems.filter(item => item.promoPrice && item.promoPrice > 0);
  const categories = ['Semua', ...new Set(menuItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex bg-stone-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('menu')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'menu' ? "bg-white shadow-sm text-orange-600" : "text-stone-500 hover:text-stone-700"
            )}
          >
            Katalog Menu
          </button>
          <button
            onClick={() => setActiveTab('promo')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'promo' ? "bg-white shadow-sm text-orange-600" : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Percent size={16} />
            Kelola Promo Item
          </button>
        </div>

        {activeTab === 'promo' && isAdmin && (
          <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-orange-600 hover:bg-orange-700 gap-2 rounded-xl">
                  <Plus size={18} />
                  Set Promo Baru
                </Button>
              }
            />
            <DialogContent className="bg-white max-w-md">
              <DialogHeader>
                <DialogTitle>Atur Promo Produk</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdatePromo} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pilih Produk</Label>
                  <Select 
                    onValueChange={(val) => {
                      const item = menuItems.find(i => i.id === val);
                      setSelectedItemForPromo(item || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih menu..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {menuItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Rp {item.price.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItemForPromo && (
                  <>
                    <div className="bg-stone-50 p-4 rounded-xl space-y-2 border border-stone-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">Harga Normal:</span>
                        <span className="font-bold text-stone-900">Rp {selectedItemForPromo.price.toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promoPriceInput">Harga Promo (Diskon)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Rp</span>
                          <Input 
                            id="promoPriceInput" 
                            type="number" 
                            value={promoPriceInput}
                            onChange={(e) => setPromoPriceInput(e.target.value)}
                            placeholder="Contoh: 15000"
                            className="pl-10 font-bold text-orange-600"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400 italic">
                        * Harga ini akan langsung menggantikan harga normal di katalog pelanggan (dengan coretan).
                      </p>
                    </div>
                  </>
                )}

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsPromoDialogOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={!selectedItemForPromo} className="bg-orange-600 hover:bg-orange-700">Simpan Promo</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {activeTab === 'menu' ? (
        <>
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6 flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600 shrink-0">
              <Tag size={18} />
            </div>
            <div>
              <p className="text-orange-900 text-sm font-bold">Mode Pengelolaan Katalog</p>
              <p className="text-orange-800/80 text-xs mt-0.5">
                Pilih menu yang ingin ditampilkan kepada pelanggan di aplikasi pemesanan. Item dengan promo akan otomatis menampilkan label diskon.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <Button 
                  key={cat} 
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  className={cn(
                    "rounded-full px-6 whitespace-nowrap",
                    activeCategory === cat ? "bg-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-orange-500 hover:text-orange-600"
                  )}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="Cari menu..." 
                className="pl-10 bg-white border-stone-200 focus:ring-orange-500"
                value={effectiveSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className={cn(
                "border-none shadow-sm bg-white overflow-hidden group transition-all duration-300",
                !item.displayed && "opacity-60 grayscale-[0.5]"
              )}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={item.image || `https://picsum.photos/seed/${item.id}/400/300`} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className="bg-white/90 text-stone-900 border-none hover:bg-white/90 font-bold">
                      {item.category}
                    </Badge>
                    {item.promoPrice && (
                      <Badge className="bg-orange-600 text-white border-none animate-pulse">
                        Sedia Promo
                      </Badge>
                    )}
                  </div>
                  {!item.displayed && (
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                      <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-none py-1.5 px-3">
                        <EyeOff size={14} className="mr-1.5" /> Tersembunyi
                      </Badge>
                    </div>
                  )}
                  {isAdmin && (
                  <button 
                    onClick={() => toggleDisplay(item.id)}
                    className={cn(
                      "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300",
                      item.displayed ? "bg-green-500/80 text-white" : "bg-stone-500/80 text-white"
                    )}
                  >
                    {item.displayed ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-stone-900 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{item.rating || 4.5}</span>
                    </div>
                  </div>
                  <p className="text-stone-500 text-sm mb-4 line-clamp-2 h-10">{item.description}</p>
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                      {item.promoPrice ? (
                        <>
                          <span className="text-xs text-stone-400 line-through">Rp {item.price.toLocaleString()}</span>
                          <span className="text-xl font-bold text-orange-600">Rp {item.promoPrice.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-stone-900">Rp {item.price.toLocaleString()}</span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400">{item.reviews || 0} ulasan</span>
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  {isAdmin ? (
                    <Button 
                      variant={item.displayed ? "outline" : "default"}
                      className={cn(
                        "w-full gap-2 transition-all duration-300 rounded-xl",
                        item.displayed ? "border-stone-200 text-stone-500" : "bg-orange-600 hover:bg-orange-700"
                      )}
                      onClick={() => toggleDisplay(item.id)}
                    >
                      {item.displayed ? (
                        <><EyeOff size={18} /> Sembunyikan</>
                      ) : (
                        <><Eye size={18} /> Tampilkan Menu</>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full bg-stone-900 hover:bg-stone-800 rounded-xl gap-2">
                      <ShoppingCart size={18} />
                      Pesan Sekarang
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {itemsOnPromo.map((item) => (
              <Card key={item.id} className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2">
                  <Badge className="bg-orange-600 text-white border-none uppercase text-[10px] tracking-widest font-bold">
                    ON SALE
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                      <Flame size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-stone-900">{item.name}</CardTitle>
                      <p className="text-xs text-stone-400 capitalize">{item.category}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Harga Normal</span>
                      <span className="text-sm font-bold text-stone-600 line-through">Rp {item.price.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex flex-col">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Harga Promo</span>
                      <span className="text-sm font-bold text-orange-600">Rp {item.promoPrice?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-stone-500">Hemat:</span>
                    <span className="font-bold text-green-600 font-mono">
                      Rp {(item.price - (item.promoPrice || 0)).toLocaleString()} ({Math.round(((item.price - (item.promoPrice || 0)) / item.price) * 100)}%)
                    </span>
                  </div>
                </CardContent>
                {isAdmin && (
                  <CardFooter className="bg-stone-50/50 p-4 border-t border-stone-100 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-lg border-stone-200 text-stone-500 hover:text-orange-600 hover:border-orange-200"
                      onClick={() => {
                        setSelectedItemForPromo(item);
                        setPromoPriceInput(item.promoPrice?.toString() || '');
                        setIsPromoDialogOpen(true);
                      }}
                    >
                      <Edit2 size={14} className="mr-2" /> Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => removePromo(item.id, item.name)}
                    >
                      <Trash2 size={14} className="mr-2" /> Hapus Promo
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}

            {itemsOnPromo.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border-2 border-dashed border-stone-200">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                  <Tag size={32} className="text-stone-200" />
                </div>
                <p className="text-stone-400 font-medium">Belum ada menu yang sedang promo.</p>
                {isAdmin && (
                  <Button 
                    variant="link" 
                    className="mt-2 text-orange-600 font-bold"
                    onClick={() => setIsPromoDialogOpen(true)}
                  >
                    Mulai buat promo pertama →
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {isAdmin && menuItems.length > itemsOnPromo.length && (
            <div className="mt-8 p-6 bg-white border border-stone-100 rounded-3xl">
              <h4 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-orange-600" />
                Cepat Set Promo
              </h4>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {menuItems.filter(item => !item.promoPrice).map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItemForPromo(item);
                      setPromoPriceInput('');
                      setIsPromoDialogOpen(true);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-stone-100 hover:border-orange-500 hover:bg-orange-50/50 transition-all shrink-0 w-32"
                  >
                    <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden">
                      <img src={item.image || `https://picsum.photos/seed/${item.id}/100/100`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-stone-700 text-center line-clamp-1">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

