import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye,
  Filter,
  X,
  Settings
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  stock: number;
  description?: string;
  ingredients?: { stockId: string; amount: number }[];
}

interface StockItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  type: string;
}

interface ManageMenuProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  stockItems: StockItem[];
  searchTerm?: string;
}

export function ManageMenu({ menuItems, setMenuItems, stockItems, searchTerm = '' }: ManageMenuProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  
  // Recipe related state
  const [currentRecipe, setCurrentRecipe] = useState<{ stockId: string; amount: number }[]>([]);

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const handleAddIngredient = () => {
    setCurrentRecipe([...currentRecipe, { stockId: stockItems[0]?.id || '', amount: 1 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setCurrentRecipe(currentRecipe.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: 'stockId' | 'amount', value: string | number) => {
    const updatedRecipe = [...currentRecipe];
    updatedRecipe[index] = { ...updatedRecipe[index], [field]: value };
    setCurrentRecipe(updatedRecipe);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    
    // Tambahkan resep bahan baku ke dalam form data (ubah array jadi string json)
    formData.append('ingredients', JSON.stringify(currentRecipe));

    try {
      const response = await fetch('http://localhost:5000/api/menu', {
        method: 'POST',
        body: formData, // FormData otomatis handle file upload (image) dan data teks
      });

      if (!response.ok) throw new Error('Gagal menambah menu');

      // Ambil ulang data dari backend (Bisa juga menggunakan trigger prop, tapi untuk simpelnya kita paksa reload data atau sekadar alert)
      toast.success("Menu berhasil ditambahkan ke Database!");
      setIsAddDialogOpen(false);
      setCurrentRecipe([]);
      
      // Memberitahu App.tsx untuk mengambil data ulang (idealnya diteruskan via props refresh),
      // Tapi untuk saat ini kita bisa tambahkan data barunya ke state sementara agar langsung muncul
      const result = await response.json();
      const newItem: MenuItem = {
        id: result.id,
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        price: Number(formData.get('price')),
        status: Number(formData.get('stock')) > 0 ? 'Tersedia' : 'Habis',
        stock: Number(formData.get('stock')),
        description: formData.get('description') as string,
        image: result.image_url ? `http://localhost:5000${result.image_url}` : `https://picsum.photos/seed/${result.id}/300/300`,
        ingredients: currentRecipe, // Masukkan resep ke state UI
      };
      setMenuItems(prev => [newItem, ...prev]);
      
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan ke database.");
      console.error(error);
    }
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    
    // Tambahkan resep terbaru ke FormData
    formData.append('ingredients', JSON.stringify(currentRecipe));

    try {
      const response = await fetch(`http://localhost:5000/api/menu/${editingItem.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Gagal mengupdate menu');

      toast.success("Menu berhasil diperbarui di Database!");
      setIsEditDialogOpen(false);
      
      // Update data di tabel secara lokal
      const updatedItem: MenuItem = {
        ...editingItem,
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        price: Number(formData.get('price')),
        status: Number(formData.get('stock')) > 0 ? 'Tersedia' : 'Habis',
        stock: Number(formData.get('stock')),
        description: formData.get('description') as string,
        ingredients: currentRecipe, // Update resep di UI
        // Jika ada foto baru (yang tidak bisa langsung diambil URL-nya di frontend secara instan tanpa preview), kita pakai foto lama dulu.
        // Di aplikasi nyata, Anda mungkin ingin me-reload (fetch) semua data setelah update.
      };

      setMenuItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
      setEditingItem(null);
      setCurrentRecipe([]);
      
    } catch (error) {
      toast.error("Terjadi kesalahan saat update data.");
      console.error(error);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if(!confirm("Anda yakin ingin menghapus menu ini dari database?")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/menu/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Gagal menghapus');
      
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast.error("Menu berhasil dihapus dari Database");
    } catch (error) {
      toast.error("Gagal menghapus data.");
    }
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input 
            placeholder="Cari menu..." 
            className="pl-10 bg-white border-stone-200"
            value={effectiveSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className={cn("gap-2 border-stone-200", categoryFilter !== 'Semua' && "bg-orange-50 border-orange-200 text-orange-700")}>
                  <Filter size={18} />
                  {categoryFilter === 'Semua' ? 'Filter' : categoryFilter}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter Kategori</DropdownMenuLabel>
                <DropdownMenuCheckboxItem 
                  checked={categoryFilter === 'Semua'} 
                  onCheckedChange={() => setCategoryFilter('Semua')}
                >
                  Semua Kategori
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={categoryFilter === 'Makanan'} 
                  onCheckedChange={() => setCategoryFilter('Makanan')}
                >
                  Makanan
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={categoryFilter === 'Minuman'} 
                  onCheckedChange={() => setCategoryFilter('Minuman')}
                >
                  Minuman
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={categoryFilter === 'Tambahan'} 
                  onCheckedChange={() => setCategoryFilter('Tambahan')}
                >
                  Tambahan
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (open) setCurrentRecipe([]);
            }}>
            <DialogTrigger
              render={
                <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <Plus size={18} />
                  Tambah Menu
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleSaveMenu}>
                <DialogHeader>
                  <DialogTitle>Tambah Menu Baru</DialogTitle>
                  <DialogDescription>
                    Lengkapi detail menu di bawah ini. Klik simpan setelah selesai.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Menu</Label>
                    <Input id="name" name="name" placeholder="Contoh: Bakso Mercon" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select name="category" defaultValue="Makanan">
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Makanan">Makanan</SelectItem>
                          <SelectItem value="Minuman">Minuman</SelectItem>
                          <SelectItem value="Tambahan">Tambahan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Harga (Rp)</Label>
                      <Input id="price" name="price" type="number" placeholder="25000" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea id="description" name="description" placeholder="Jelaskan detail menu..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stok Awal</Label>
                    <Input id="stock" name="stock" type="number" placeholder="100" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="image" className="text-orange-600">Upload Foto Menu</Label>
                    <Input id="image" name="image" type="file" accept="image/*" className="cursor-pointer" />
                    <p className="text-[10px] text-stone-500 italic">*Format: JPG, PNG. Maksimal 2MB.</p>
                  </div>
                  
                  {/* KONFIGURASI RESEP */}
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Settings size={14} className="text-orange-600" />
                        Konfigurasi Resep (Bahan Baku)
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} className="h-7 text-[10px] gap-1">
                        <Plus size={12} /> Tambah Bahan
                      </Button>
                    </div>
                    
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                      {currentRecipe.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <Label className="text-[10px] text-stone-400">Pilih Bahan</Label>
                            <Select 
                              value={ing.stockId} 
                              onValueChange={(val) => handleIngredientChange(idx, 'stockId', val)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Pilih bahan" />
                              </SelectTrigger>
                              <SelectContent>
                                {stockItems.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.unit})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24 space-y-1">
                            <Label className="text-[10px] text-stone-400">Jumlah / Porsi</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="h-8 text-xs" 
                              value={ing.amount}
                              onChange={(e) => handleIngredientChange(idx, 'amount', Number(e.target.value))}
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-stone-400 hover:text-red-500"
                            onClick={() => handleRemoveIngredient(idx)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                      {currentRecipe.length === 0 && (
                        <div className="py-4 text-center border-2 border-dashed border-stone-100 rounded-lg">
                          <p className="text-[10px] text-stone-400 italic">Belum ada bahan baku dikonfigurasi.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Menu</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-stone-100">
                <TableHead className="w-[300px]">Nama Menu</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="hidden md:table-cell w-[250px]">Deskripsi</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMenu.map((item) => (
                <TableRow key={item.id} className="border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <TableCell className="font-medium text-stone-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden">
                        <img 
                          src={item.image && item.image.startsWith('/uploads') ? `http://localhost:5000${item.image}` : (item.image || `https://picsum.photos/seed/${item.id}/100/100`)} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal border-stone-200 bg-stone-50">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-stone-500 max-w-[250px] truncate">
                    {item.description || <span className="italic text-stone-300">Tidak ada deskripsi</span>}
                  </TableCell>
                  <TableCell className="font-mono">
                    Rp {item.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className={item.stock < 10 ? "text-red-600 font-medium" : "text-stone-600"}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={item.status === 'Tersedia' 
                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" 
                        : "bg-red-100 text-red-700 hover:bg-red-100 border-none"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="text-stone-400">
                            <MoreVertical size={18} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                          <DropdownMenuItem className="gap-2" onClick={() => toast.info(`Detail: ${item.name}`)}>
                            <Eye size={16} /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => {
                            setEditingItem(item);
                            setCurrentRecipe(item.ingredients || []);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit2 size={16} /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDeleteMenu(item.id)}>
                            <Trash2 size={16} /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleUpdateMenu}>
            <DialogHeader>
              <DialogTitle>Edit Menu</DialogTitle>
              <DialogDescription>
                Perbarui detail menu di bawah ini. Klik simpan untuk menerapkan perubahan.
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nama Menu</Label>
                  <Input id="edit-name" name="name" defaultValue={editingItem.name} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Kategori</Label>
                    <Select name="category" defaultValue={editingItem.category}>
                      <SelectTrigger id="edit-category">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Makanan">Makanan</SelectItem>
                        <SelectItem value="Minuman">Minuman</SelectItem>
                        <SelectItem value="Tambahan">Tambahan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Harga (Rp)</Label>
                    <Input id="edit-price" name="price" type="number" defaultValue={editingItem.price} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Deskripsi</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editingItem.description} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stok</Label>
                  <Input id="edit-stock" name="stock" type="number" defaultValue={editingItem.stock} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-image" className="text-orange-600">Ganti Foto Menu</Label>
                  <Input id="edit-image" name="image" type="file" accept="image/*" className="cursor-pointer" />
                  <p className="text-[10px] text-stone-500 italic">*Biarkan kosong jika tidak ingin mengubah foto lama.</p>
                </div>

                {/* KONFIGURASI RESEP EDIT */}
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Settings size={14} className="text-orange-600" />
                      Edit Resep (Bahan Baku)
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} className="h-7 text-[10px] gap-1">
                      <Plus size={12} /> Tambah Bahan
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                    {currentRecipe.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] text-stone-400">Pilih Bahan</Label>
                          <Select 
                            value={ing.stockId} 
                            onValueChange={(val) => handleIngredientChange(idx, 'stockId', val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Pilih bahan" />
                            </SelectTrigger>
                            <SelectContent>
                              {stockItems.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.unit})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-[10px] text-stone-400">Jumlah / Porsi</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-8 text-xs" 
                            value={ing.amount}
                            onChange={(e) => handleIngredientChange(idx, 'amount', Number(e.target.value))}
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-stone-400 hover:text-red-500"
                          onClick={() => handleRemoveIngredient(idx)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
