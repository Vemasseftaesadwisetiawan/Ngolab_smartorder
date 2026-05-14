import React, { useState } from 'react';
import { 
  Plus, 
  TicketPercent, 
  Calendar, 
  Clock, 
  MoreVertical,
  Copy,
  CheckCircle2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

interface Promo {
  id: string;
  title: string;
  code: string;
  discount: string;
  type: string;
  period: string;
  status: string;
  usageCount: number;
  maxUsage: number | null;
  minPurchase: number;
}

interface PromoManagementProps {
  promos: Promo[];
  setPromos: React.Dispatch<React.SetStateAction<Promo[]>>;
  searchTerm?: string;
}

export function PromoManagement({ promos, setPromos, searchTerm = '' }: PromoManagementProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [discountType, setDiscountType] = useState('Percentage');

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const handleDeletePromo = (id: string) => {
    setPromos(prev => prev.filter(promo => promo.id !== id));
    toast.error("Promo berhasil dihapus");
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const title = formData.get('title') as string;
    const code = formData.get('code') as string;
    const discountValue = formData.get('discountValue') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const maxUsage = formData.get('maxUsage') ? Number(formData.get('maxUsage')) : null;
    const minPurchase = Number(formData.get('minPurchase') || 0);

    const formattedDiscount = discountType === 'Percentage' ? `${discountValue}%` : `Rp ${Number(discountValue).toLocaleString()}`;
    const formattedPeriod = `${startDate} - ${endDate}`;

    const newPromo: Promo = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      code,
      discount: formattedDiscount,
      type: discountType,
      period: formattedPeriod,
      status: 'Active',
      usageCount: 0,
      maxUsage,
      minPurchase
    };

    setPromos(prev => [newPromo, ...prev]);
    toast.success("Promo baru berhasil dibuat!");
    setIsAddDialogOpen(false);
  };

  const handleEditPromo = (promo: Promo) => {
    setEditingPromo(promo);
    setDiscountType(promo.type);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const code = formData.get('code') as string;
    const discountValue = formData.get('discountValue') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const maxUsage = formData.get('maxUsage') ? Number(formData.get('maxUsage')) : null;
    const minPurchase = Number(formData.get('minPurchase') || 0);

    const formattedDiscount = discountType === 'Percentage' ? 
      (discountValue.includes('%') ? discountValue : `${discountValue}%`) : 
      (discountValue.startsWith('Rp') ? discountValue : `Rp ${Number(discountValue).toLocaleString()}`);
    
    const formattedPeriod = (startDate && endDate) ? `${startDate} - ${endDate}` : editingPromo.period;

    setPromos(prev => prev.map(p => 
      p.id === editingPromo.id ? {
        ...p,
        title,
        code,
        discount: formattedDiscount,
        type: discountType,
        period: formattedPeriod,
        maxUsage,
        minPurchase
      } : p
    ));

    toast.success("Promo berhasil diperbarui!");
    setIsEditDialogOpen(false);
    setEditingPromo(null);
  };

  const filteredPromos = promos.filter(promo => {
    const matchesSearch = promo.title.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      promo.code.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || promo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input 
            placeholder="Cari promo atau kode..." 
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
                  <TicketPercent size={18} />
                  {statusFilter === 'Semua' ? 'Filter' : statusFilter}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Semua'} onCheckedChange={() => setStatusFilter('Semua')}>Semua Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Active'} onCheckedChange={() => setStatusFilter('Active')}>Aktif</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Ended'} onCheckedChange={() => setStatusFilter('Ended')}>Berakhir</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus size={18} />
                Buat Promo Baru
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Buat Promo Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePromo} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Promo</Label>
                <Input id="title" name="title" placeholder="Contoh: Promo Akhir Tahun" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Kode Promo</Label>
                <Input id="code" name="code" placeholder="Contoh: AKHIRTAHUN2024" className="uppercase" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Tipe Potongan</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Percentage">Persentase (%)</SelectItem>
                      <SelectItem value="Fixed">Nominal (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Nilai Potongan</Label>
                  <Input id="discountValue" name="discountValue" type="number" placeholder={discountType === 'Percentage' ? "20" : "5000"} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Berakhir</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minPurchase">Minimal Pembelian (Rp)</Label>
                <Input id="minPurchase" name="minPurchase" type="number" defaultValue="0" placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsage">Kuota Penggunaan (Kosongkan jika ∞)</Label>
                <Input id="maxUsage" name="maxUsage" type="number" placeholder="∞" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Promo</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Edit Promo</DialogTitle>
            </DialogHeader>
            {editingPromo && (
              <form onSubmit={handleUpdatePromo} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Judul Promo</Label>
                  <Input id="edit-title" name="title" defaultValue={editingPromo.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Kode Promo</Label>
                  <Input id="edit-code" name="code" defaultValue={editingPromo.code} className="uppercase" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-discountType">Tipe Potongan</Label>
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger id="edit-discountType">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Percentage">Persentase (%)</SelectItem>
                        <SelectItem value="Fixed">Nominal (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-discountValue">Nilai Potongan</Label>
                    <Input 
                      id="edit-discountValue" 
                      name="discountValue" 
                      defaultValue={editingPromo.discount.replace(/[^0-9]/g, '')} 
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Tanggal Mulai</Label>
                    <Input id="edit-startDate" name="startDate" type="date" defaultValue={editingPromo.period.split(' - ')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">Tanggal Berakhir</Label>
                    <Input id="edit-endDate" name="endDate" type="date" defaultValue={editingPromo.period.split(' - ')[1]} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minPurchase">Minimal Pembelian (Rp)</Label>
                  <Input id="edit-minPurchase" name="minPurchase" type="number" defaultValue={editingPromo.minPurchase} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxUsage">Kuota Penggunaan</Label>
                  <Input id="edit-maxUsage" name="maxUsage" type="number" defaultValue={editingPromo.maxUsage || ''} placeholder="∞" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Perubahan</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPromos.map((promo) => (
          <Card key={promo.id} className="border-none shadow-sm bg-white overflow-hidden">
            <div className={cn(
              "h-2 w-full",
              promo.status === 'Active' ? "bg-green-500" : "bg-stone-300"
            )} />
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-stone-900">{promo.title}</CardTitle>
                <Badge className={cn(
                  "font-normal border-none",
                  promo.status === 'Active' ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                )}>
                  {promo.status}
                </Badge>
              </div>
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
                    <DropdownMenuItem className="gap-2" onClick={() => handleEditPromo(promo)}>
                      Edit Promo
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => toast.info(`Statistik: ${promo.title}`)}>
                      Lihat Statistik
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDeletePromo(promo.id)}>
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 border-dashed flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-orange-600 uppercase tracking-widest font-bold mb-1">Kode Promo</p>
                  <p className="text-xl font-mono font-bold text-orange-900">{promo.code}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-orange-600 hover:bg-orange-100"
                  onClick={() => {
                    navigator.clipboard.writeText(promo.code);
                    toast.success(`Kode ${promo.code} disalin!`);
                  }}
                >
                  <Copy size={18} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-stone-400 font-medium">Potongan</p>
                  <p className="font-bold text-stone-900">{promo.discount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-stone-400 font-medium">Min. Pembelian</p>
                  <p className="text-stone-600 text-sm">Rp {promo.minPurchase.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-50 space-y-3">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Calendar size={14} />
                  <span>{promo.period}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <CheckCircle2 size={14} />
                  <span>Terpakai: <span className="font-bold text-stone-900">{promo.usageCount}/{promo.maxUsage || '∞'}</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

