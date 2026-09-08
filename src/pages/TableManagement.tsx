import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  QrCode,
  MoreVertical,
  Trash2,
  ExternalLink,
  Printer,
  Edit2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/apiFetch';

interface Table {
  id: string;
  number: string;
  capacity?: number;
  status: 'Available' | 'Occupied' | 'Reserved';
  type: 'Table' | 'Spot';
  zone: string;
  smartLink: string;
  lastScanned?: string;
}

export function TableManagement() {
  // ── Semua useState harus di bagian paling atas ──
  const [tables, setTables] = useState<Table[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('Semua Zona');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua Status');
  const [zones, setZones] = useState<string[]>([]);
  const [isManualZone, setIsManualZone] = useState(false);
  const [tagType, setTagType] = useState<'Table' | 'Spot'>('Table');
  const qrRef = useRef<HTMLDivElement>(null);

  // ── Helper: buat link smart tag dinamis ──
  const getDynamicSmartLink = (t: { number: string; zone?: string } | null) => {
    if (!t) return '';
    const base = window.location.origin;
    const zoneQuery = t.zone ? `&zona=${encodeURIComponent(t.zone)}` : '';
    return `${base}/?meja=${encodeURIComponent(t.number)}${zoneQuery}`;
  };

  // ── Ambil data smart tags dari API ──
  useEffect(() => {
    apiFetch('/api/smart-tags')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const mappedData = data.map((t: any) => {
            const type = t.type === 'Meja' || t.type === 'Table' ? 'Table' : 'Spot';
            const status = t.status === 'Tersedia' || t.status === 'Available' ? 'Available' :
                           t.status === 'Terisi' || t.status === 'Occupied' ? 'Occupied' : 'Reserved';
            return {
              ...t,
              type,
              status
            };
          });
          setTables(mappedData);
          const uniqueZones = Array.from(
            new Set(mappedData.map((t: Table) => t.zone).filter(Boolean))
          ) as string[];
          setZones(uniqueZones);
        }
      })
      .catch(err => console.error("Gagal memanggil API Smart Tags", err));
  }, []);

  // ── Filter tabel ──
  const filteredTables = tables.filter(t =>
    (selectedZone === 'Semua Zona' || t.zone === selectedZone) &&
    (selectedStatus === 'Semua Status' || t.status === selectedStatus) &&
    (String(t.number).includes(searchTerm) || (t.zone && String(t.zone).toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // ── Cetak QR Code ──
  const handlePrintQrCode = () => {
    if (!selectedTable || !qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan popup tidak diblokir.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak QR Code - ${selectedTable.number}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
            .container { border: 2px solid #e5e7eb; padding: 40px; border-radius: 24px; display: inline-block; }
            .qr-wrapper { width: 300px; height: 300px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
            .qr-wrapper svg { width: 100% !important; height: 100% !important; }
            .table-name { font-size: 32px; font-weight: bold; margin: 20px 0 10px; color: #1c1917; }
            .instruction { color: #57534e; font-size: 16px; margin-bottom: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr-wrapper">${svgData}</div>
            <div class="table-name">${selectedTable.type === 'Table' ? `MEJA ${selectedTable.number}` : selectedTable.number}</div>
            ${selectedTable.zone && selectedTable.zone !== 'Area Meja'
              ? `<div style="font-size:20px;font-weight:bold;color:#ea580c;margin-top:-5px;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">ZONA: ${selectedTable.zone}</div>`
              : ''}
            <div class="instruction">Scan untuk melihat menu dan memesan</div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editCapacity, setEditCapacity] = useState<number | string>(4);
  const [editZone, setEditZone] = useState('Area Meja');
  const [editType, setEditType] = useState<'Table' | 'Spot'>('Table');
  const [editStatus, setEditStatus] = useState<'Available' | 'Occupied' | 'Reserved'>('Available');

  // ── Tambah Smart Tag baru ──
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const number = formData.get('number') as string;
    const capacity = tagType === 'Table' ? Number(formData.get('capacity')) : undefined;

    let zone = '';
    if (isManualZone) {
      zone = formData.get('manualZone') as string;
      if (zone && !zones.includes(zone)) {
        setZones(prev => [...prev, zone]);
      }
    } else {
      zone = formData.get('zone') as string;
    }

    if (!zone) zone = tagType === 'Table' ? 'Area Meja' : '';

    if (!zone && tagType === 'Spot') {
      toast.error("Zona lokasi harus diisi untuk Titik Layanan");
      return;
    }

    const tagId = `${tagType === 'Table' ? 'TAG' : 'SPOT'}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newTable: Table = {
      id: tagId,
      number,
      capacity,
      status: 'Available',
      type: tagType,
      zone,
      smartLink: getDynamicSmartLink({ number, zone }),
    };

    try {
      const response = await apiFetch('/api/smart-tags', {
        method: 'POST',
        body: JSON.stringify({
          ...newTable,
          type: newTable.type === 'Table' ? 'Meja' : 'Takeaway',
          status: newTable.status === 'Available' ? 'Tersedia' : 
                  newTable.status === 'Occupied' ? 'Terisi' : 'Reservasi'
        })
      });
      if (!response.ok) throw new Error('Gagal ke server');
      setTables(prev => [newTable, ...prev]);
      setIsAddDialogOpen(false);
      setIsManualZone(false);
      toast.success(`Smart Tag untuk ${tagType === 'Table' ? 'Meja' : 'Lokasi'} ${number} berhasil dibuat!`);
    } catch (err) {
      toast.error('Gagal menyimpan ke database MySQL');
    }
  };

  // ── Edit Smart Tag ──
  const openEditTable = (table: Table) => {
    setEditingTable(table);
    setEditNumber(table.number);
    setEditCapacity(table.capacity || 4);
    setEditZone(table.zone || 'Area Meja');
    setEditType(table.type);
    setEditStatus(table.status);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    const payload = {
      type: editType === 'Table' ? 'Meja' : 'Takeaway',
      number: editNumber,
      capacity: editType === 'Table' ? Number(editCapacity) : null,
      zone: editZone,
      status: editStatus === 'Available' ? 'Tersedia' : editStatus === 'Occupied' ? 'Terisi' : 'Reservasi',
      smartLink: getDynamicSmartLink({ number: editNumber, zone: editZone })
    };

    try {
      const response = await apiFetch(`/api/smart-tags/${editingTable.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Gagal update di server');

      const updated: Table = {
        ...editingTable,
        number: editNumber,
        capacity: editType === 'Table' ? Number(editCapacity) : undefined,
        zone: editZone,
        type: editType,
        status: editStatus,
        smartLink: getDynamicSmartLink({ number: editNumber, zone: editZone })
      };

      setTables(prev => prev.map(t => t.id === editingTable.id ? updated : t));
      toast.success(`Smart Tag ${editNumber} berhasil diperbarui!`);
      setIsEditDialogOpen(false);
      setEditingTable(null);
    } catch (err) {
      toast.error('Gagal memperbarui data meja di server');
    }
  };

  const handleUpdateTableStatus = async (id: string, newStatus: 'Available' | 'Occupied' | 'Reserved') => {
    const dbStatus = newStatus === 'Available' ? 'Tersedia' : newStatus === 'Occupied' ? 'Terisi' : 'Reservasi';
    try {
      const response = await apiFetch(`/api/smart-tags/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: dbStatus })
      });
      if (!response.ok) throw new Error('Gagal ubah status');

      setTables(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      toast.success(`Status meja diubah menjadi ${newStatus === 'Available' ? 'Tersedia' : newStatus === 'Occupied' ? 'Terisi' : 'Reservasi'}`);

      // re-fetch agar sinkron dengan server
      const res = await apiFetch('/api/smart-tags');
      const data = await res.json();
      if (!data.error) {
        const mappedData = data.map((t: any) => {
          const type = t.type === 'Meja' || t.type === 'Table' ? 'Table' : 'Spot';
          const status = t.status === 'Tersedia' || t.status === 'Available' ? 'Available' :
                         t.status === 'Terisi' || t.status === 'Occupied' ? 'Occupied' : 'Reserved';
          return { ...t, type, status };
        });
        setTables(mappedData);
      }
    } catch (err) {
      toast.error('Gagal mengubah status meja di server');
    }
  };

  // ── Hapus Smart Tag ──
  const handleDeleteTable = async (id: string) => {
    if (!confirm("Anda yakin ingin menghapus smart tag ini?")) return;
    try {
      await apiFetch(`/api/smart-tags/${id}`, { method: 'DELETE' });
      setTables(prev => prev.filter(t => t.id !== id));
      toast.success("Tag berhasil dihapus dari sistem");
    } catch (err) {
      toast.error("Gagal menghapus tag dari database");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Manajemen Smart Tag & Meja</h2>
          <p className="text-xs text-neutral-500">Kelola identifikasi meja dan link pesanan otomatis.</p>
        </div>
        <Button
          className="gap-2 bg-neutral-900 hover:bg-neutral-800"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus size={18} />
          Daftarkan Meja Baru
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-neutral-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Cari nomor meja atau zona lokasi..."
            className="pl-10 border-neutral-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            className="flex-1 md:w-48 h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <option value="Semua Zona">Semua Zona</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <select
            className="flex-1 md:w-40 h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Available">Tersedia</option>
            <option value="Occupied">Terisi</option>
            <option value="Reserved">Dipesan</option>
            <option value="Inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filteredTables.length === 0 && (
        <div className="text-center py-20 text-neutral-400">
          <QrCode size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Belum ada Smart Tag terdaftar</p>
          <p className="text-sm">Klik "Daftarkan Meja Baru" untuk mulai membuat tag.</p>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <Card key={table.id} className="overflow-hidden border border-neutral-200 bg-white">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-md text-white flex items-center justify-center font-bold text-sm text-center p-1",
                  table.type === 'Table' ? "bg-neutral-900" : "bg-neutral-700"
                )}>
                  {table.type === 'Table' ? table.number : <QrCode size={20} />}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {table.type === 'Table' ? `Meja ${table.number}` : table.number}
                  </CardTitle>
                  {table.type === 'Spot' && (
                    <CardDescription className="text-[10px] text-neutral-500 font-medium">{table.zone}</CardDescription>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical size={16} />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2" onClick={() => {
                    setSelectedTable(table);
                    setIsQrDialogOpen(true);
                  }}>
                    <QrCode size={16} /> Lihat Smart Tag
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => openEditTable(table)}>
                    <Edit2 size={16} /> Edit Detail Tag
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => handleUpdateTableStatus(table.id, 'Available')}>
                    Set Status: Tersedia
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => handleUpdateTableStatus(table.id, 'Occupied')}>
                    Set Status: Terisi
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => handleUpdateTableStatus(table.id, 'Reserved')}>
                    Set Status: Reservasi
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => handleUpdateTableStatus(table.id, 'Inactive')}>
                    Set Status: Nonaktif
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => window.open(getDynamicSmartLink(table), '_blank')}>
                    <ExternalLink size={16} /> Test Pelacakan Lokasi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => handleDeleteTable(table.id)}>
                    <Trash2 size={16} /> Hapus Smart Tag
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  className={cn(
                    "border-none text-[10px] font-medium",
                    table.status === 'Available' ? "bg-neutral-100 text-neutral-700" :
                      table.status === 'Occupied' ? "bg-neutral-200 text-neutral-800" :
                        "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {table.type === 'Spot' ? 'Titik Layanan Active' : 
                    (table.status === 'Available' ? 'Tersedia' : table.status === 'Occupied' ? 'Terisi' : table.status === 'Reserved' ? 'Dipesan' : 'Nonaktif')}
                </Badge>
                {table.lastScanned && (
                  <div className="text-[10px] text-neutral-400 font-medium italic">Scan: {table.lastScanned}</div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={cn("h-full w-full opacity-30", table.type === 'Table' ? "bg-neutral-900" : "bg-neutral-700")} />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono italic">SmartTag Aktif</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-8 text-[10px] gap-2 border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                    onClick={() => {
                      setSelectedTable(table);
                      setIsQrDialogOpen(true);
                    }}
                  >
                    <QrCode size={12} />
                    Cek Posisi
                  </Button>
                  <Badge variant="outline" className="text-[9px] font-normal border-neutral-100 text-neutral-400">
                    {table.type === 'Table' ? `${table.capacity} Pax` : 'Service Point'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Dialog: Registrasi Meja / Tag ── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle>Daftarkan Smart Tag Baru</DialogTitle>
            <DialogDescription>
              Buat tag untuk meja makan atau titik layanan lainnya.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTable} className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-md">
              <Button
                type="button"
                variant={tagType === 'Table' ? 'default' : 'ghost'}
                className={cn("h-8 text-xs", tagType === 'Table' ? "bg-white text-neutral-900" : "text-neutral-500 hover:text-neutral-800")}
                onClick={() => setTagType('Table')}
              >
                Meja Makan
              </Button>
              <Button
                type="button"
                variant={tagType === 'Spot' ? 'default' : 'ghost'}
                className={cn("h-8 text-xs", tagType === 'Spot' ? "bg-white text-neutral-900" : "text-neutral-500 hover:text-neutral-800")}
                onClick={() => setTagType('Spot')}
              >
                Titik Spot / Layanan
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number" className="text-xs">{tagType === 'Table' ? 'Nomor Meja' : 'Label Lokasi'}</Label>
                <Input id="number" name="number" placeholder={tagType === 'Table' ? "Contoh: 01, A1" : "Contoh: Barisan Sofa"} required />
              </div>
              {tagType === 'Table' && (
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-xs">Kapasitas</Label>
                  <Input id="capacity" name="capacity" type="number" defaultValue="4" required />
                </div>
              )}
            </div>

            {tagType === 'Spot' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zone" className="text-xs">Zona Fisik / Area</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto p-0 text-[10px] text-orange-600 font-bold hover:bg-transparent"
                    onClick={() => setIsManualZone(!isManualZone)}
                  >
                    {isManualZone ? "Pilih dari Daftar" : "+ Tambah Zona Baru"}
                  </Button>
                </div>
                {isManualZone ? (
                  <div className="space-y-2">
                    <Input
                      id="manualZone"
                      name="manualZone"
                      placeholder="Contoh: Rooftop Bar, Area Takeaway"
                      required
                      autoFocus
                      className="h-9 text-sm"
                    />
                    <p className="text-[10px] text-stone-400 italic font-medium">*Zona baru akan disimpan dalam sistem</p>
                  </div>
                ) : (
                  <select
                    id="zone"
                    name="zone"
                    className="w-full h-9 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>— Pilih Zona Lokasi —</option>
                    <option value="Area Meja">Area Meja (Bawaan)</option>
                    {zones.filter(z => z !== 'Area Meja').map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                )}
              </div>
            )}

            <div className="p-3 bg-neutral-100 rounded-md border border-neutral-200 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                <QrCode size={16} className="text-neutral-700" />
              </div>
              <p className="text-[10px] text-neutral-700 leading-relaxed font-medium">
                {tagType === 'Table'
                  ? "Sistem akan mengenali nomor meja ini setiap kali pelanggan melakukan scan."
                  : "Pelanggan di area ini akan terdata berada di koordinat lokasi yang Anda tentukan secara otomatis."}
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="h-9 text-xs bg-orange-600 hover:bg-orange-700">Aktifkan Smart Tag</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Preview QR Code ── */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader className="items-center text-center">
        <DialogTitle className="text-xl">
          Smart Tag {selectedTable?.type === 'Table' ? `Meja ${selectedTable?.number}` : selectedTable?.number}
          {selectedTable?.zone && selectedTable.zone !== 'Area Meja' && ` (${selectedTable.zone})`}
        </DialogTitle>
        <DialogDescription className="text-center">
          Scan atau cetak kode ini untuk diletakkan di {selectedTable?.type === 'Table' ? 'meja makan' : 'titik layanan'}.
        </DialogDescription>
        </DialogHeader>
        <div className="py-2 flex flex-col items-center gap-6">
        <div ref={qrRef} className="p-4 bg-white border border-neutral-200 rounded-md">
              <QRCodeSVG
                value={getDynamicSmartLink(selectedTable) || 'https://smartorder.app'}
                size={180}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/vite.svg",
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>
            <div className="space-y-2 w-full text-center px-2">
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Link Destinasi</p>
              <p className="text-[11px] font-mono bg-neutral-50 p-3 rounded-lg border border-neutral-200 break-all text-neutral-600">
                {getDynamicSmartLink(selectedTable)}
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2 pt-2">
            <Button variant="outline" className="flex-1 gap-2 border-neutral-200" onClick={handlePrintQrCode}>
              <Printer size={16} /> Cetak QR
            </Button>
            <Button className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white" onClick={() => setIsQrDialogOpen(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Meja / Tag ── */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setEditingTable(null);
        }
      }}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Smart Tag</DialogTitle>
            <DialogDescription>
              Perbarui konfigurasi nomor meja, kapasitas, atau zona.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTable} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-number" className="text-xs">Nomor / Label Meja</Label>
                <Input id="edit-number" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} required />
              </div>
              {editType === 'Table' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity" className="text-xs">Kapasitas (Pax)</Label>
                  <Input id="edit-capacity" type="number" value={editCapacity} onChange={(e) => setEditCapacity(Number(e.target.value))} required />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-zone" className="text-xs">Zona / Area</Label>
              <Input id="edit-zone" value={editZone} onChange={(e) => setEditZone(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-xs">Status Meja</Label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full h-9 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                <option value="Available">Tersedia</option>
                <option value="Occupied">Terisi</option>
                <option value="Reserved">Reservasi</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingTable(null);
              }}>Batal</Button>
              <Button type="submit" className="h-9 text-xs bg-orange-600 hover:bg-orange-700">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
