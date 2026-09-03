import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  Plus, 
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  Filter,
  Package,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
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
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { apiFetch } from '@/lib/apiFetch';
import { EmptyState } from '@/components/ui/empty-state';

interface StockItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  min: number;
  status: string;
  expiry_date?: string;
}

interface StockManagementProps {
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  searchTerm?: string;
}

export function StockManagement({ stockItems, setStockItems, searchTerm = '' }: StockManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [selectedUnit, setSelectedUnit] = useState<string>('kg');
  const [isLoading, setIsLoading] = useState(true);

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  useEffect(() => {
    const fetchStock = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/stock');
        const data = await res.json();
        if (!data.error) {
          const mapped = data.map((item: any) => ({
            ...item,
            id: String(item.id)
          }));
          setStockItems(mapped);
        } else {
          toast.error(data.message || 'Gagal memuat data stok');
        }
      } catch (err) {
        console.error('Gagal mengambil data stok:', err);
        toast.error('Tidak dapat terhubung ke server');
      } finally {
        setIsLoading(false);
      }
    };

    if (stockItems.length === 0) {
      fetchStock();
    } else {
      setIsLoading(false);
    }
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Aman':
        return { label: 'Aman', className: 'bg-green-50 text-green-700 border border-green-100', icon: '✓' };
      case 'Menipis':
        return { label: 'Menipis', className: 'bg-amber-50 text-amber-700 border border-amber-100', icon: '⚠' };
      case 'Kritis':
        return { label: 'Kritis', className: 'bg-red-50 text-red-700 border border-red-100', icon: '!' };
      case 'Habis':
        return { label: 'Habis', className: 'bg-stone-100 text-stone-600 border border-stone-200', icon: '×' };
      case 'Hampir Kadaluwarsa':
        return { label: 'Hampir Kadaluwarsa', className: 'bg-orange-50 text-orange-700 border border-orange-200', icon: '⏰' };
      case 'Kedaluwarsa':
        return { label: 'Kedaluwarsa', className: 'bg-red-50 text-red-800 border border-red-200', icon: '✕' };
      default:
        return { label: status, className: 'bg-stone-50 text-stone-600 border border-stone-200', icon: '•' };
    }
  };

  const handleUpdateStock = async (id: string, amount: number) => {
    try {
      const response = await apiFetch(`/api/stock/${id}/adjust`, {
        method: 'PUT',
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Gagal memperbarui stok di server');
      const data = await response.json();
      
      setStockItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, qty: data.qty, status: data.status, expiry_date: data.expiry_date };
        }
        return item;
      }));
      toast.success("Stok berhasil diperbarui");
    } catch (err) {
      console.error("Gagal update stok:", err);
      toast.error("Gagal memperbarui stok di server");
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const qty = Number(formData.get('qty'));
    const min = Number(formData.get('min'));
    const name = formData.get('name') as string;
    const unit = selectedUnit;
    const expiry_date = formData.get('expiry_date') as string || null;

    if (editingItem) {
      try {
        const response = await apiFetch(`/api/stock/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, qty, unit, min, expiry_date }),
        });
        if (!response.ok) throw new Error('Gagal memperbarui bahan baku di server');
        const data = await response.json();

        setStockItems(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, name, qty: data.qty, unit, min: data.min, status: data.status, expiry_date: data.expiry_date }
            : item
        ));
        toast.success("Data inventaris berhasil diperbarui!");
        setEditingItem(null);
      } catch (err) {
        console.error("Gagal edit bahan baku:", err);
        toast.error("Gagal menyimpan perubahan ke server");
      }
    } else {
      try {
        const response = await apiFetch('/api/stock', {
          method: 'POST',
          body: JSON.stringify({ name, qty, unit, min, expiry_date }),
        });
        if (!response.ok) throw new Error('Gagal menambahkan bahan baku ke server');
        const data = await response.json();

        const newItem: StockItem = {
          id: String(data.id),
          name: data.name,
          qty: data.qty,
          unit: data.unit,
          min: data.min,
          status: data.status,
          expiry_date: data.expiry_date,
        };
        setStockItems(prev => [...prev, newItem]);
        toast.success("Item inventaris berhasil ditambahkan!");
        setIsAddDialogOpen(false);
      } catch (err) {
        console.error("Gagal tambah bahan baku:", err);
        toast.error("Gagal menyimpan bahan baku ke server");
      }
    }
  };

  const handleDeleteStock = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus bahan baku ini dari inventaris?")) return;
    try {
      const response = await apiFetch(`/api/stock/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Gagal menghapus bahan baku di server');
      
      setStockItems(prev => prev.filter(item => String(item.id) !== String(id)));
      toast.success("Bahan baku berhasil dihapus!");
    } catch (err) {
      console.error("Gagal menghapus bahan baku:", err);
      toast.error("Gagal menghapus bahan baku di server");
    }
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    const total = stockItems.length;
    const critical = stockItems.filter(item => item.status === 'Kritis' || item.status === 'Habis').length;
    const nearExpiry = stockItems.filter(item => item.status === 'Hampir Kadaluwarsa').length;
    return { total, critical, nearExpiry };
  }, [stockItems]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border border-neutral-200 bg-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-500">Total Item</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-2 bg-neutral-100 rounded-md">
                <Package size={18} className="text-neutral-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-neutral-200 bg-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-500">Stok Kritis/Habis</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{stats.critical}</p>
              </div>
              <div className="p-2 bg-neutral-100 rounded-md">
                <AlertTriangle size={18} className="text-neutral-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-neutral-200 bg-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-500">Hampir Kadaluarsa</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{stats.nearExpiry}</p>
              </div>
              <div className="p-2 bg-neutral-100 rounded-md">
                <AlertTriangle size={18} className="text-neutral-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input 
            placeholder="Cari bahan baku..." 
            className="pl-10 bg-white border-neutral-200"
            value={effectiveSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className={cn("gap-2 border-neutral-200", statusFilter !== 'Semua' && "bg-neutral-100 border-neutral-300 text-neutral-700")}>
                  <Filter size={18} />
                  {statusFilter !== 'Semua' ? statusFilter : 'Filter'}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status Stok</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Semua'} onCheckedChange={() => setStatusFilter('Semua')}>Semua Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Aman'} onCheckedChange={() => setStatusFilter('Aman')}>Aman</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Menipis'} onCheckedChange={() => setStatusFilter('Menipis')}>Menipis</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Kritis'} onCheckedChange={() => setStatusFilter('Kritis')}>Kritis</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Habis'} onCheckedChange={() => setStatusFilter('Habis')}>Habis</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Hampir Kadaluwarsa'} onCheckedChange={() => setStatusFilter('Hampir Kadaluwarsa')}>Hampir Kadaluwarsa</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Kedaluwarsa'} onCheckedChange={() => setStatusFilter('Kedaluwarsa')}>Kedaluwarsa</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={isAddDialogOpen || !!editingItem} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingItem(null);
            }
          }}>
            <DialogTrigger
              render={
                <Button 
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus size={18} />
                  Tambah Stok
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSaveStock}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Perbarui detail bahan baku inventaris.' : 'Masukkan detail bahan baku baru untuk inventaris.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock-name">Nama Item</Label>
                    <Input id="stock-name" name="name" defaultValue={editingItem?.name} placeholder="Contoh: Daging Sapi atau Bakso Frozen" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="stock-qty">Stok {editingItem ? 'Saat Ini' : 'Awal'}</Label>
                      <Input id="stock-qty" name="qty" type="number" step="any" defaultValue={editingItem?.qty} placeholder="0" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock-unit">Satuan</Label>
                      <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger id="stock-unit">
                          <SelectValue placeholder="Pilih satuan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilogram (kg)</SelectItem>
                          <SelectItem value="gr">Gram (gr)</SelectItem>
                          <SelectItem value="liter">Liter (L)</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="pcs">Pcs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock-min">Batas Stok Minimum</Label>
                    <Input id="stock-min" name="min" type="number" step="any" defaultValue={editingItem?.min} placeholder="10" required />
                    <p className="text-[10px] text-stone-400 italic">Sistem akan memberi peringatan jika stok di bawah angka ini.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock-expiry">Tanggal Kadaluarsa</Label>
                    <Input id="stock-expiry" name="expiry_date" type="date" defaultValue={editingItem?.expiry_date || ''} />
                    <p className="text-[10px] text-stone-400 italic">Kosongkan jika bahan baku tidak memiliki tanggal kadaluarsa.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingItem(null);
                  }}>Batal</Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    {editingItem ? 'Simpan Perubahan' : 'Simpan Bahan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border border-neutral-200 bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="text-[11px] font-semibold text-neutral-500">Nama Item</TableHead>
                <TableHead className="text-[11px] font-semibold text-neutral-500">Stok Saat Ini</TableHead>
                <TableHead className="text-[11px] font-semibold text-neutral-500">Stok Minimum</TableHead>
                <TableHead className="text-[11px] font-semibold text-neutral-500">Kedaluwarsa</TableHead>
                <TableHead className="text-[11px] font-semibold text-neutral-500">Status</TableHead>
                <TableHead className="w-12 text-right text-[11px] font-semibold text-neutral-500">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                      <p className="text-xs text-neutral-500">Memuat data inventaris...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={<Package size={40} className="text-neutral-300" />}
                      title="Tidak ada bahan baku ditemukan"
                      description={
                        effectiveSearchTerm || statusFilter !== 'Semua'
                          ? "Coba ubah kata kunci pencarian atau filter."
                          : "Mulai dengan menambahkan bahan baku pertama ke inventaris."
                      }
                      action={
                        (effectiveSearchTerm || statusFilter !== 'Semua') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setLocalSearchTerm('');
                              setStatusFilter('Semua');
                            }}
                          >
                            Reset Filter
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  return (
                    <TableRow key={item.id} className="hover:bg-neutral-50/70">
                      <TableCell className="font-medium text-neutral-900 text-sm">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-sm font-medium",
                          item.qty <= 0 ? "text-neutral-900" : 
                          item.qty <= item.min ? "text-neutral-700" : "text-neutral-600"
                        )}>
                          {item.qty} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">
                        {item.min} {item.unit}
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm font-mono text-xs">
                        {item.expiry_date ? (
                          new Date(item.expiry_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
                          statusConfig.className
                        )}>
                          {statusConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <div className="flex items-center bg-neutral-100 rounded-md p-0.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "h-7 w-7",
                                item.qty <= 0 ? "text-neutral-300" : "text-neutral-500 hover:text-neutral-900 hover:bg-white"
                              )}
                              onClick={() => handleUpdateStock(item.id, -1)}
                              disabled={item.qty <= 0}
                            >
                              <ArrowDown size={14} />
                            </Button>
                            <div className="w-px h-4 bg-neutral-200 mx-0.5" />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-neutral-500 hover:text-neutral-900 hover:bg-white"
                              onClick={() => handleUpdateStock(item.id, 1)}
                            >
                              <ArrowUp size={14} />
                            </Button>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400">
                                  <MoreVertical size={16} />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingItem(item);
                                    setSelectedUnit(item.unit || 'kg');
                                  }} 
                                  className="gap-2"
                                >
                                  <Edit2 size={14} /> Edit Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteStock(item.id)} 
                                  className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                >
                                  <Trash2 size={14} /> Hapus Bahan
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isLoading && filteredItems.length > 0 && (
        <div className="text-sm text-stone-500 flex items-center justify-between">
          <span>
            Menampilkan <span className="font-semibold text-stone-900">{filteredItems.length}</span> dari <span className="font-semibold text-stone-900">{stockItems.length}</span> item
          </span>
          {statusFilter !== 'Semua' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStatusFilter('Semua')}
              className="text-orange-600 hover:text-orange-700"
            >
              Reset Filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
