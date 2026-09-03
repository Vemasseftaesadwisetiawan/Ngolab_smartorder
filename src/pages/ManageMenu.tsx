import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye,
  Filter,
  X,
  Utensils,
  Image as ImageIcon,
  Calendar
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
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/apiFetch';
import { EmptyState } from '@/components/ui/empty-state';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  stock: number;
  description?: string;
  image?: string;
  ingredients?: { stockId: string; amount: number }[];
  availability_type?: string;
  available_from?: string;
  available_to?: string;
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
  const [addCategory, setAddCategory] = useState<string>('Makanan');
  const [editCategory, setEditCategory] = useState<string>('Makanan');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [availabilityType, setAvailabilityType] = useState<string>('permanent');
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [availableTo, setAvailableTo] = useState<string>('');
  const [editAvailabilityType, setEditAvailabilityType] = useState<string>('permanent');
  const [editAvailableFrom, setEditAvailableFrom] = useState<string>('');
  const [editAvailableTo, setEditAvailableTo] = useState<string>('');
  const today = new Date().toISOString().split('T')[0];
  
  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Semua' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, effectiveSearchTerm, categoryFilter]);

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    
    // Manual append for controlled components not tracked by native FormData
    formData.set('category', addCategory);
    formData.set('availability_type', availabilityType);
    formData.set('available_from', availableFrom);
    formData.set('available_to', availableTo);

    try {
      const response = await apiFetch('/api/menu', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Gagal menambah menu');

      toast.success("Menu berhasil ditambahkan ke Database!");
      setIsAddDialogOpen(false);
      setImagePreview('');
      setAddCategory('Makanan');
      setAvailabilityType('permanent');
      setAvailableFrom('');
      setAvailableTo('');
      
      const result = await response.json();
      const newItem: MenuItem = {
        id: result.id,
        name: formData.get('name') as string,
        category: addCategory,
        price: Number(formData.get('price')),
        status: Number(formData.get('stock')) > 0 ? 'Tersedia' : 'Habis',
        stock: Number(formData.get('stock')),
        description: formData.get('description') as string,
        image: result.image_url ? `http://${window.location.hostname}:5000${result.image_url}` : `https://picsum.photos/seed/${result.id}/300/300`,
        ingredients: [],
        availability_type: (formData.get('availability_type') as string) || 'permanent',
        available_from: (formData.get('available_from') as string) || undefined,
        available_to: (formData.get('available_to') as string) || undefined,
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
    
    // Manual append for controlled components
    formData.set('category', editCategory);
    formData.set('availability_type', editAvailabilityType);
    formData.set('available_from', editAvailableFrom);
    formData.set('available_to', editAvailableTo);

    try {
      const response = await apiFetch(`/api/menu/${editingItem.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Gagal mengupdate menu');
      const resData = await response.json().catch(() => ({}));

      toast.success("Menu berhasil diperbarui di Database!");
      setIsEditDialogOpen(false);
      setImagePreview('');
      setEditAvailabilityType('permanent');
      setEditAvailableFrom('');
      setEditAvailableTo('');
      
      const updatedItem: MenuItem = {
        ...editingItem,
        name: formData.get('name') as string,
        category: editCategory,
        price: Number(formData.get('price')),
        status: Number(formData.get('stock')) > 0 ? 'Tersedia' : 'Habis',
        stock: Number(formData.get('stock')),
        description: formData.get('description') as string,
        image: resData.image_url ? `http://${window.location.hostname}:5000${resData.image_url}` : editingItem.image,
        availability_type: (formData.get('availability_type') as string) || 'permanent',
        available_from: (formData.get('available_from') as string) || undefined,
        available_to: (formData.get('available_to') as string) || undefined,
      };

      setMenuItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
      setEditingItem(null);
      
    } catch (error) {
      toast.error("Terjadi kesalahan saat update data.");
      console.error(error);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if(!confirm("Anda yakin ingin menghapus menu ini dari database?")) return;
    
    try {
      const response = await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Gagal menghapus');
      
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast.success("Menu berhasil dihapus dari Database");
    } catch (error) {
      toast.error("Gagal menghapus data.");
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setEditCategory(item.category || 'Makanan');
    setImagePreview(item.image || '');
    setEditAvailabilityType(item.availability_type || 'permanent');
    setEditAvailableFrom(item.available_from || '');
    setEditAvailableTo(item.available_to || '');
    setIsEditDialogOpen(true);
  };

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
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                      <Select value={addCategory} onValueChange={setAddCategory}>
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
                    <Label htmlFor="availability_type">Tipe Ketersediaan</Label>
                    <Select name="availability_type" value={availabilityType} onValueChange={setAvailabilityType}>
                      <SelectTrigger id="availability_type">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Menu Tetap</SelectItem>
                        <SelectItem value="scheduled">Menu Tanggal Tertentu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {availabilityType === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="available_from">Dari Tanggal</Label>
                        <Input id="available_from" name="available_from" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="available_to">Sampai Tanggal</Label>
                        <Input id="available_to" name="available_to" type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="image" className="text-orange-600 font-semibold">Upload Foto Menu</Label>
                    <Input id="image" name="image" type="file" accept="image/*" className="cursor-pointer" />
                    <p className="text-[10px] text-stone-500 italic">*Format: JPG, PNG. Maksimal 2MB.</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs text-stone-500 font-medium">Total Menu</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{menuItems.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs text-stone-500 font-medium">Menu Tetap</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{menuItems.filter(i => i.availability_type === 'permanent').length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs text-stone-500 font-medium">Scheduled Hari Ini</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{menuItems.filter(i => i.availability_type === 'scheduled' && i.available_from && i.available_to && i.available_from <= today && i.available_to >= today).length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs text-stone-500 font-medium">Habis</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{menuItems.filter(i => i.status === 'Habis').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-stone-100">
                <TableHead className="w-[300px]">Nama Menu</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMenu.map((item) => (
                <TableRow key={item.id} className="border-stone-50 hover:bg-stone-50/80 transition-colors">
                  <TableCell className="font-medium text-stone-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image && item.image.startsWith('/uploads') ? `http://${window.location.hostname}:5000${item.image}` : (item.image || `https://picsum.photos/seed/${item.id}/100/100`)} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="font-normal border-stone-200 bg-stone-50 w-fit">
                        {item.category}
                      </Badge>
                      {item.availability_type === 'scheduled' && item.available_from && item.available_to && (
                        <span className="text-[10px] text-orange-600 font-semibold flex items-center gap-1">
                          <Calendar size={10} />
                          {item.available_from} - {item.available_to}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-stone-500 max-w-[250px] truncate">
                    {item.description || <span className="italic text-stone-300">Tidak ada deskripsi</span>}
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    Rp {item.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className={item.stock < 10 ? "text-red-600 font-semibold" : "text-stone-600 font-medium"}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        className={item.status === 'Tersedia' 
                          ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" 
                          : "bg-red-100 text-red-700 hover:bg-red-100 border-none"
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.availability_type === 'scheduled' && (
                        <span className="text-[10px] text-orange-600 font-semibold">
                          Tanggal Tertentu
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-600">
                            <MoreVertical size={18} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                          <DropdownMenuItem className="gap-2" onClick={() => toast.info(`Detail: ${item.name}`)}>
                            <Eye size={16} /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(item)}>
                            <Edit2 size={16} /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDeleteMenu(item.id)}>
                            <Trash2 size={16} /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMenu.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <EmptyState
                      icon={<Utensils size={48} className="text-stone-300" />}
                      title="Tidak ada menu ditemukan"
                      description={
                        effectiveSearchTerm || categoryFilter !== 'Semua'
                          ? "Coba ubah kata kunci pencarian atau filter Anda."
                          : "Mulai dengan menambahkan menu pertama Anda."
                      }
                      action={
                        (effectiveSearchTerm || categoryFilter !== 'Semua') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setLocalSearchTerm('');
                              setCategoryFilter('Semua');
                            }}
                          >
                            Reset Filter
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
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
                    <Select value={editCategory} onValueChange={setEditCategory}>
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
                  <Label htmlFor="edit-availability_type">Tipe Ketersediaan</Label>
                  <Select name="availability_type" value={editAvailabilityType} onValueChange={setEditAvailabilityType}>
                    <SelectTrigger id="edit-availability_type">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Menu Tetap</SelectItem>
                      <SelectItem value="scheduled">Menu Tanggal Tertentu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editAvailabilityType === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-available_from">Dari Tanggal</Label>
                      <Input id="edit-available_from" name="available_from" type="date" value={editAvailableFrom} onChange={(e) => setEditAvailableFrom(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-available_to">Sampai Tanggal</Label>
                      <Input id="edit-available_to" name="available_to" type="date" value={editAvailableTo} onChange={(e) => setEditAvailableTo(e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-image" className="text-orange-600 font-semibold">Ganti Foto Menu</Label>
                  <Input id="edit-image" name="image" type="file" accept="image/*" className="cursor-pointer" />
                  <p className="text-[10px] text-stone-500 italic">*Biarkan kosong jika tidak ingin mengubah foto lama.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingItem(null);
                setImagePreview('');
              }}>Batal</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
