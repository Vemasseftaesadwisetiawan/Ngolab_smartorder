import React from 'react';
import { 
  Search, 
  Calendar, 
  Download, 
  Filter,
  Eye,
  Printer,
  X
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";

import { cn } from '@/lib/utils';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  total: number;
  time: string;
  status: string;
}

interface TransactionHistoryProps {
  orders: Order[];
  searchTerm?: string;
}

export function TransactionHistory({ orders, searchTerm = '' }: TransactionHistoryProps) {
  const [localSearchTerm, setLocalSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('Semua');
  const [dateFilter, setDateFilter] = React.useState<string>('');
  const [selectedTrx, setSelectedTrx] = React.useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  
  const handlePrintReceipt = (trx: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan popup tidak diblokir.");
      return;
    }

    const itemsHtml = trx.items.map(item => `
      <div style="display: flex; justify-between; margin-bottom: 5px;">
        <span style="flex: 1;">${item.quantity}x ${item.name}</span>
        <span>Rp ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Transaksi - ${trx.id}</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 300px; 
              margin: 0 auto; 
              padding: 20px;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; }
            .info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .items { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .total { font-weight: bold; display: flex; justify-content: space-between; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
            @media print {
              body { width: 100%; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SARIKAYO ONLINE</h1>
            <p>Bukti Pembayaran</p>
          </div>
          <div class="info">
            <div style="display: flex; justify-content: space-between;">
              <span>No. Transaksi:</span>
              <span>${trx.id}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Meja:</span>
              <span>${trx.table}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Waktu:</span>
              <span>${trx.time}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Status:</span>
              <span>${(trx.status === 'Siap Disajikan' || trx.status === 'Selesai') ? 'LUNAS' : 'PENDING'}</span>
            </div>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>Rp ${trx.total.toLocaleString()}</span>
          </div>
          <div class="footer">
            <p>Terima Kasih Atas Kunjungan Anda</p>
            <p>Silahkan Datang Kembali</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const filteredTransactions = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      order.table.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'Semua' || 
      (statusFilter === 'Success' && order.status === 'Selesai') ||
      (statusFilter === 'Pending' && order.status === 'Menunggu');
      
    // Mencocokkan tanggal (asumsi format order.time mengandung tanggal yang dapat dicocokkan)
    // Jika data menggunakan format "DD MMM YYYY", kita perlu menyesuaikan pencocokan.
    // Sebagai contoh sederhana, kita cari apakah string tanggal ada di dalam string waktu.
    let matchesDate = true;
    if (dateFilter && order.time) {
      const [year, month, day] = dateFilter.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthIdx = parseInt(month) - 1;
      const dayNum = parseInt(day).toString();
      
      const dateStringShort = `${dayNum} ${months[monthIdx]} ${year}`;
      const dateStringFull = `${day} ${months[monthIdx]} ${year}`;
      
      matchesDate = order.time.includes(dateStringShort) || 
                   order.time.includes(dateStringFull) || 
                   order.time.includes(dateFilter);
    } else if (dateFilter && !order.time) {
      matchesDate = false;
    }
      
    return matchesSearch && matchesStatus && matchesDate;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input 
            placeholder="Cari transaksi..." 
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
                  {statusFilter === 'Semua' ? 'Filter' : statusFilter}
                </Button>
              } />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'Semua'} 
                onCheckedChange={() => setStatusFilter('Semua')}
              >
                Semua Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'Success'} 
                onCheckedChange={() => setStatusFilter('Success')}
              >
                Success
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'Pending'} 
                onCheckedChange={() => setStatusFilter('Pending')}
              >
                Pending
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <input 
              type="date"
              ref={dateInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setDateFilter(e.target.value)}
              value={dateFilter}
              style={{ colorScheme: 'light' }}
            />
            <Button 
              variant="outline" 
              className={cn("gap-2 border-stone-200 pointer-events-none", dateFilter && "bg-orange-50 border-orange-200 text-orange-700")}
            >
              <Calendar size={18} />
              {dateFilter ? dateFilter : "Pilih Tanggal"}
            </Button>
            {dateFilter && (
              <button 
                className="absolute -top-2 -right-2 bg-stone-900 text-white rounded-full p-0.5 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setDateFilter('');
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button variant="outline" className="gap-2 border-stone-200" onClick={() => toast.success("Data berhasil diekspor ke Excel")}>
            <Download size={18} />
            Ekspor
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-stone-100">
                <TableHead>Metode</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Meja / Lokasi</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((trx) => (
                <TableRow key={trx.id} className="border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <TableCell className="font-bold text-stone-900 text-xs font-normal">SmartOrder</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-stone-900 font-medium">{trx.time}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-stone-900 font-medium">{trx.table}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    Rp {(trx.total || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "border-none",
                        trx.status === 'Selesai' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}
                    >
                      {trx.status === 'Selesai' ? 'Success' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-stone-400"
                        onClick={() => {
                          setSelectedTrx(trx);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-stone-400"
                        onClick={() => handlePrintReceipt(trx)}
                      >
                        <Printer size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-stone-400">
                    Tidak ada transaksi ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selectedTrx && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                <div>
                  <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">ID Transaksi</p>
                  <p className="text-lg font-bold text-stone-900">{selectedTrx.id}</p>
                </div>
                <Badge 
                  className={cn(
                    "border-none",
                    selectedTrx.status === 'Selesai' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  )}
                >
                  {selectedTrx.status === 'Selesai' ? 'Success' : 'Pending'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-400 font-medium">Meja / Lokasi</p>
                  <p className="text-stone-900 font-bold">{selectedTrx.table}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">Waktu</p>
                  <p className="text-stone-900 font-bold">{selectedTrx.time}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">Item Pesanan</p>
                <div className="space-y-2">
                  {selectedTrx.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-stone-600">
                        <span className="font-bold text-stone-900">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="text-stone-900 font-medium">Rp ${((item.price || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                <p className="text-base font-bold text-stone-900">Total Pembayaran</p>
                <p className="text-xl font-bold text-orange-600">Rp {(selectedTrx.total || 0).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => selectedTrx && handlePrintReceipt(selectedTrx)}>
              <Printer size={16} /> Cetak Struk
            </Button>
            <Button className="flex-1 bg-stone-900 hover:bg-stone-800" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
