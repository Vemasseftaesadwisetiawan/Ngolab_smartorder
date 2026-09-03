import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  TicketPercent, 
  Calendar, 
  Clock, 
  MoreVertical,
  Copy,
  CheckCircle2,
  Search,
  Percent,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/apiFetch';
import { EmptyState } from '@/components/ui/empty-state';

interface Promo {
  id: string;
  title: string;
  code: string;
  discount: number | string;
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
  const [discountType, setDiscountType] = useState('Persentase');

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const filteredPromos = useMemo(() => {
    return promos.filter(promo => {
      const matchesSearch = promo.title.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        promo.code.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Semua' || promo.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [promos, effectiveSearchTerm, statusFilter]);

  const handleDeletePromo = async (id: string) => {
    try {
      const response = await apiFetch(`/api/promos/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Gagal menghapus');

      setPromos(prev => prev.filter(promo => promo.id !== id));
      toast.success("Promo berhasil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus promo dari database");
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const title = formData.get('title') as string;
    const code = (formData.get('code') as string).toUpperCase();
    const discountValue = formData.get('discountValue') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const maxUsage = formData.get('maxUsage') ? Number(formData.get('maxUsage')) : null;
    const minPurchase = Number(formData.get('minPurchase') || 0);

    const discountNum = Number(discountValue) || 0;
    const formattedPeriod = `${startDate} - ${endDate}`;

    const newPromo: Promo = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      code,
      discount: discountNum,
      type: discountType,
      period: formattedPeriod,
      status: 'Active',
      usageCount: 0,
      maxUsage,
      minPurchase
    };

    try {
      const response = await apiFetch('/api/promos', {
        method: 'POST',
        body: JSON.stringify(newPromo)
      });
      if (!response.ok) throw new Error('Gagal menyimpan');

      setPromos(prev => [newPromo, ...prev]);
      toast.success("Promo baru berhasil dibuat!");
      setIsAddDialogOpen(false);
    } catch (err) {
      toast.error("Gagal menyimpan promo baru ke database");
    }
  };

  const handleEditPromo = (promo: Promo) => {
    setEditingPromo(promo);
    setDiscountType(promo.type);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const code = (formData.get('code') as string).toUpperCase();
    const discountValue = formData.get('discountValue') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const maxUsage = formData.get('maxUsage') ? Number(formData.get('maxUsage')) : null;
    const minPurchase = Number(formData.get('minPurchase') || 0);

    const discountNum = Number(discountValue) || 0;
    const formattedPeriod = (startDate && endDate) ? `${startDate} - ${endDate}` : editingPromo.period;

    const updatedPromo = {
      title,
      code,
      discount: discountNum,
      type: discountType,
      period: formattedPeriod,
      maxUsage,
      minPurchase
    };

    try {
      const response = await apiFetch(`/api/promos/${editingPromo.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPromo)
      });
      if (!response.ok) throw new Error('Gagal update');

      setPromos(prev => prev.map(p => 
        p.id === editingPromo.id ? {
          ...p,
          ...updatedPromo
        } : p
      ));

      toast.success("Promo berhasil diperbarui!");
      setIsEditDialogOpen(false);
      setEditingPromo(null);
    } catch (err) {
      toast.error("Gagal memperbarui promo di database");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input 
            placeholder="Cari promo atau kode..." 
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
                <Button className="gap-2 bg-neutral-900 hover:bg-neutral-800">
                  <Plus size={18} />
                  Buat Promo Baru
                </Button>
              }
            />
          <DialogContent className="sm:max-w-[425px]">
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
                    <SelectContent>
                      <SelectItem value="Persentase">Persentase (%)</SelectItem>
                      <SelectItem value="Nominal">Nominal (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Nilai Potongan</Label>
                  <Input id="discountValue" name="discountValue" type="number" placeholder={discountType === 'Persentase' ? "20" : "5000"} required />
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
          <DialogContent className="sm:max-w-[425px]">
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
                      <SelectContent>
                        <SelectItem value="Persentase">Persentase (%)</SelectItem>
                        <SelectItem value="Nominal">Nominal (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-discountValue">Nilai Potongan</Label>
                    <Input 
                      id="edit-discountValue" 
                      name="discountValue" 
                      defaultValue={Number(editingPromo.discount)} 
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
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingPromo(null);
                  }}>Batal</Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Perubahan</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {filteredPromos.length > 0 ? (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredPromos.map((promo) => (
        <Card key={promo.id} className="border border-neutral-200 bg-white overflow-hidden">
          <div className={cn(
            "h-1.5 w-full",
            promo.status === 'Active' ? "bg-neutral-900" : "bg-neutral-300"
          )} />
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-base font-semibold text-neutral-900 leading-tight">{promo.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  "font-semibold border-none",
                  promo.status === 'Active' ? "bg-neutral-100 text-neutral-700" : "bg-neutral-50 text-neutral-500"
                )}>
                  {promo.status}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-600">
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
              <CardContent className="space-y-4">
                <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">Kode Promo</p>
                    <p className="text-lg font-mono font-bold text-neutral-900 tracking-wider">{promo.code}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-neutral-500 hover:bg-neutral-100"
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
                    <div className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                      {promo.type === 'Persentase' ? <Percent size={12} /> : <DollarSign size={12} />}
                      Potongan
                    </div>
                    <p className="font-semibold text-neutral-900">
                      {promo.type === 'Persentase' ? `${promo.discount}%` : `Rp ${Number(promo.discount).toLocaleString('id-ID')}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-neutral-400 font-medium">Min. Pembelian</p>
                    <p className="text-neutral-600 text-sm font-semibold">Rp {promo.minPurchase.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-50 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Calendar size={14} className="text-neutral-400" />
                    <span>{promo.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <CheckCircle2 size={14} className="text-neutral-400" />
                    <span>Terpakai: <span className="font-semibold text-neutral-900">{promo.usageCount}/{promo.maxUsage || '∞'}</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-neutral-200 bg-white">
          <CardContent className="p-0">
            <EmptyState
              icon={<TicketPercent size={48} className="text-neutral-300" />}
              title="Tidak ada promo ditemukan"
              description={
                effectiveSearchTerm || statusFilter !== 'Semua'
                  ? "Coba ubah kata kunci pencarian atau filter Anda."
                  : "Buat promo pertama untuk menarik pelanggan."
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
