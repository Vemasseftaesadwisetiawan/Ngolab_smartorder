import React, { useState } from 'react';
import { 
  ArrowDown, 
  Plus, 
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  Filter
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

interface StockItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  min: number;
  status: string;
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

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const calculateStatus = (qty: number, min: number) => {
    if (qty <= min / 2) return 'critical';
    if (qty <= min) return 'warning';
    return 'safe';
  };

  const handleUpdateStock = (id: string, amount: number) => {
    setStockItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + amount);
        return { ...item, qty: newQty, status: calculateStatus(newQty, item.min) };
      }
      return item;
    }));
    toast.success("Stok berhasil diperbarui");
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const qty = Number(formData.get('qty'));
    const min = Number(formData.get('min'));
    const name = formData.get('name') as string;
    const unit = formData.get('unit') as string;

    if (editingItem) {
      setStockItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, name, qty, unit, min, status: calculateStatus(qty, min) }
          : item
      ));
      toast.success("Data inventaris berhasil diperbarui!");
      setEditingItem(null);
    } else {
      const newItem: StockItem = {
        id: name,
        name,
        qty,
        unit,
        min,
        status: calculateStatus(qty, min),
      };
      setStockItems(prev => [...prev, newItem]);
      toast.success("Item inventaris berhasil ditambahkan!");
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteStock = (id: string) => {
    setStockItems(prev => prev.filter(item => item.id !== id));
    toast.error("Bahan baku telah dihapus");
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const criticalCount = stockItems.filter(item => item.status === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-500">Stok Kritis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", criticalCount > 0 ? "text-red-600" : "text-green-600")}>
              {criticalCount} Item
            </div>
            <p className="text-xs text-stone-400 mt-1">
              {criticalCount > 0 ? "Segera lakukan pemesanan" : "Semua stok aman"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-500">Total Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length} Item</div>
            <p className="text-xs text-stone-400 mt-1">Terdaftar dalam inventaris</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input 
            placeholder="Cari bahan baku..." 
            className="pl-10 bg-white border-stone-200"
            value={effectiveSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className={cn("gap-2 border-stone-200", statusFilter !== 'Semua' && "bg-orange-50 border-orange-200 text-orange-700")}>
                  <Filter size={18} />
                  Filter
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status Stok</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Semua'} onCheckedChange={() => setStatusFilter('Semua')}>Semua Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'safe'} onCheckedChange={() => setStatusFilter('safe')}>Aman</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'warning'} onCheckedChange={() => setStatusFilter('warning')}>Peringatan</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'critical'} onCheckedChange={() => setStatusFilter('critical')}>Kritis</DropdownMenuCheckboxItem>
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
                      <Input id="stock-qty" name="qty" type="number" defaultValue={editingItem?.qty} placeholder="0" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock-unit">Satuan</Label>
                      <Select name="unit" defaultValue={editingItem?.unit || "kg"}>
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
                    <Input id="stock-min" name="min" type="number" defaultValue={editingItem?.min} placeholder="10" required />
                    <p className="text-[10px] text-stone-400 italic">Sistem akan memberi peringatan jika stok di bawah angka ini.</p>
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

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-stone-100">
                <TableHead>Nama Item</TableHead>
                <TableHead>Stok Saat Ini</TableHead>
                <TableHead>Stok Minimum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <TableCell className="font-medium text-stone-900">
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-700">{item.qty} {item.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-stone-500">
                    {item.min} {item.unit}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "border-none",
                        item.status === 'safe' ? "bg-green-100 text-green-700" : 
                        item.status === 'warning' ? "bg-yellow-100 text-yellow-700" : 
                        "bg-red-100 text-red-700"
                      )}
                    >
                      {item.status === 'safe' ? 'Aman' : item.status === 'warning' ? 'Menipis' : 'Kritis'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <div className="flex items-center bg-stone-100 rounded-lg p-1 mr-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-stone-500 hover:text-red-600 hover:bg-white"
                          onClick={() => handleUpdateStock(item.id, -1)}
                        >
                          <ArrowDown size={14} />
                        </Button>
                        <div className="w-px h-4 bg-stone-200 mx-1" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-stone-500 hover:text-green-600 hover:bg-white"
                          onClick={() => handleUpdateStock(item.id, 1)}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400">
                              <MoreVertical size={16} />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditingItem(item)} className="gap-2">
                              <Edit2 size={14} /> Edit Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStock(item.id)} 
                              className="gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 size={14} /> Hapus Bahan
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-stone-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="opacity-20" />
                      <p>Tidak ada bahan baku ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


