import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  QrCode, 
  Download, 
  MoreVertical, 
  Trash2, 
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Printer
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
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  number: string;
  capacity?: number;
  status: 'Available' | 'Occupied' | 'Reserved';
  type: 'Table' | 'Spot'; // New field to distinguish between table and spot
  zone: string;
  smartLink: string;
  lastScanned?: string;
}

const initialTables: Table[] = [];

export function TableManagement() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Mengambil data smart tags dari MySQL saat halaman dibuka
  React.useEffect(() => {
    fetch('http://localhost:5000/api/smart-tags')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setTables(data);
      })
      .catch(err => console.error("Gagal memanggil API Smart Tags", err));
  }, []);

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
            body { 
              font-family: sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              text-align: center;
              padding: 20px;
            }
            .container {
              border: 2px solid #e5e7eb;
              padding: 40px;
              border-radius: 24px;
              display: inline-block;
            }
            .qr-wrapper {
              width: 300px;
              height: 300px;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-wrapper svg {
              width: 100% !important;
              height: 100% !important;
            }
            .table-name {
              font-size: 32px;
              font-weight: bold;
              margin: 20px 0 10px;
              color: #1c1917;
            }
            .instruction {
              color: #57534e;
              font-size: 16px;
              margin-bottom: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr-wrapper">
              ${svgData}
            </div>
            <div class="table-name">MEJA ${selectedTable.number}</div>
            <div class="instruction">Scan untuk melihat menu dan memesan</div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const [selectedZone, setSelectedZone] = useState<string>('Semua Zona');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua Status');
  const [zones, setZones] = useState<string[]>([]);
  const [isManualZone, setIsManualZone] = useState(false);
  const [tagType, setTagType] = useState<'Table' | 'Spot'>('Table');

  const filteredTables = tables.filter(t => 
    (selectedZone === 'Semua Zona' || t.zone === selectedZone) &&
    (selectedStatus === 'Semua Status' || t.status === selectedStatus) &&
    (t.number.includes(searchTerm) || t.zone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const number = formData.get('number') as string;
    const capacity = tagType === 'Table' ? Number(formData.get('capacity')) : undefined;
    
    let zone = '';
    if (tagType === 'Table') {
      zone = 'Area Meja';
    } else {
      if (isManualZone) {
        zone = formData.get('manualZone') as string;
        if (zone && !zones.includes(zone)) {
          setZones([...zones, zone]);
        }
      } else {
        zone = formData.get('zone') as string;
      }
    }

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
      smartLink: `https://smartorder.app/scan/${tagId}?loc=${zone.toLowerCase().replace(/\s+/g, '_')}`,
    };

    try {
      const response = await fetch('http://localhost:5000/api/smart-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable)
      });
      if (!response.ok) throw new Error('Gagal ke server');
      
      setTables([newTable, ...tables]);
      setIsAddDialogOpen(false);
      setIsManualZone(false);
      toast.success(`Smart Tag untuk ${tagType === 'Table' ? 'Meja' : 'Lokasi'} ${number} berhasil dibuat!`);
    } catch (err) {
      toast.error('Gagal menyimpan ke database MySQL');
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/smart-tags/${id}`, { method: 'DELETE' });
      setTables(tables.filter(t => t.id !== id));
      toast.success("Tag berhasil dihapus dari sistem");
    } catch (err) {
      toast.error("Gagal menghapus tag dari database");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Manajemen Smart Tag & Meja</h2>
          <p className="text-stone-500">Kelola identifikasi meja dan link pesanan otomatis.</p>
        </div>
        <Button 
          className="gap-2 bg-orange-600 hover:bg-orange-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus size={18} />
          Daftarkan Meja Baru
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input 
            placeholder="Cari nomor meja atau zona lokasi..." 
            className="pl-10 border-stone-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:w-48 h-10 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <option value="Semua Zona">Semua Zona</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <select 
            className="flex-1 md:w-40 h-10 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Available">Tersedia</option>
            <option value="Occupied">Terisi</option>
            <option value="Reserved">Dipesan</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <Card key={table.id} className="overflow-hidden border-stone-100 hover:border-orange-200 transition-all group">
            <CardHeader className="p-4 flex flex-row items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold text-sm text-center p-1",
                  table.type === 'Table' ? "bg-stone-900" : "bg-orange-600"
                )}>
                  {table.type === 'Table' ? table.number : <QrCode size={20} />}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">
                    {table.type === 'Table' ? `Meja ${table.number}` : table.number}
                  </CardTitle>
                  {table.type === 'Spot' && (
                    <CardDescription className="text-[10px] text-orange-600 font-semibold">{table.zone}</CardDescription>
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
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="gap-2" onClick={() => {
                      setSelectedTable(table);
                      setIsQrDialogOpen(true);
                    }}>
                      <QrCode size={16} /> Lihat Smart Tag
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => window.open(table.smartLink, '_blank')}>
                      <ExternalLink size={16} /> Test Pelacakan Lokasi
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => handleDeleteTable(table.id)}>
                    <Trash2 size={16} /> Non-aktifkan Tag
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge 
                  className={cn(
                    "border-none text-[10px]",
                    table.status === 'Available' ? "bg-green-100 text-green-700" : 
                    table.status === 'Occupied' ? "bg-orange-100 text-orange-700" : 
                    "bg-blue-100 text-blue-700"
                  )}
                >
                  {table.type === 'Spot' ? 'Titik Layanan Active' : 
                    (table.status === 'Available' ? 'Tersedia' : table.status === 'Occupied' ? 'Terisi' : 'Dipesan')}
                </Badge>
                {table.lastScanned && (
                  <div className="text-[10px] text-stone-400 font-medium italic">Scan: {table.lastScanned}</div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                    <div className={cn("h-full w-full opacity-30", table.type === 'Table' ? "bg-stone-900" : "bg-orange-600")} />
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono italic">SmartTag Aktif</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-8 text-[10px] gap-2 border-stone-200 text-stone-600 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50/30"
                    onClick={() => {
                      setSelectedTable(table);
                      setIsQrDialogOpen(true);
                    }}
                  >
                    <QrCode size={12} />
                    Cek Posisi
                  </Button>
                  <Badge variant="outline" className="text-[9px] font-normal border-stone-100 text-stone-400">
                    {table.type === 'Table' ? `${table.capacity} Pax` : 'Service Point'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Registrasi Meja / Tag */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle>Daftarkan Smart Tag Baru</DialogTitle>
            <DialogDescription>
              Buat tag untuk meja makan atau titik layanan lainnya.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTable} className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-lg">
              <Button 
                type="button" 
                variant={tagType === 'Table' ? 'default' : 'ghost'} 
                className={cn("h-8 text-xs", tagType === 'Table' ? "bg-white text-stone-900 shadow-sm hover:bg-white" : "text-stone-500")}
                onClick={() => setTagType('Table')}
              >
                Meja Makan
              </Button>
              <Button 
                type="button" 
                variant={tagType === 'Spot' ? 'default' : 'ghost'} 
                className={cn("h-8 text-xs", tagType === 'Spot' ? "bg-white text-stone-900 shadow-sm hover:bg-white" : "text-stone-500")}
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
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
                    className="w-full h-9 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>— Pilih Zona Lokasi —</option>
                    {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                )}
              </div>
            )}

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <QrCode size={16} className="text-orange-600" />
              </div>
              <p className="text-[10px] text-orange-800 leading-relaxed font-medium">
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

      {/* Dialog Preview QR / Smart Tag */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-center">
          <DialogHeader>
            <DialogTitle>Smart Tag Meja {selectedTable?.number}</DialogTitle>
            <DialogDescription>
              Scan atau cetak kode ini untuk diletakkan di meja makan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center gap-6">
            <div ref={qrRef} className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
              <QRCodeSVG 
                value={selectedTable?.smartLink || ''} 
                size={200}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/vite.svg", // Using a placeholder or SO logo if available
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            
            <div className="space-y-1 w-full px-4">
              <p className="text-xs text-stone-400 font-medium">Link Destinasi:</p>
              <p className="text-sm font-mono bg-stone-50 p-2 rounded border border-stone-100 truncate text-stone-600">
                {selectedTable?.smartLink}
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={handlePrintQrCode}>
              <Printer size={16} /> Cetak QR Code
            </Button>
            <Button className="flex-1 bg-stone-900 hover:bg-stone-800" onClick={() => setIsQrDialogOpen(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
