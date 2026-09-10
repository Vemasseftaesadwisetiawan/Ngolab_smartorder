import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Download, 
  Filter,
  Eye,
  Printer,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { EmptyState } from '@/components/ui/empty-state';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table: string;
  customer?: string;
  items: OrderItem[];
  total: number;
  time: string;
  date?: string;
  status: string;
  type: string;
  paymentMethod?: string;
  paymentProofUrl?: string;
  paymentProofStatus?: 'pending' | 'approved' | 'rejected';
  voucherCode?: string;
  rewardName?: string;
  pointsSpent?: number;
}

interface TransactionHistoryProps {
  orders: Order[];
  searchTerm?: string;
  onVerifyPaymentProof?: (orderId: string, status: 'approved' | 'rejected') => void;
}

export function TransactionHistory({ orders, searchTerm = '', onVerifyPaymentProof }: TransactionHistoryProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedTrx, setSelectedTrx] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handlePrintReceipt = (trx: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan popup tidak diblokir.");
      return;
    }

    const itemsHtml = trx.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
        <span style="flex: 1;">${item.quantity}x ${item.name}</span>
        <span style="margin-left: 16px;">Rp ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Transaksi - ${trx.id}</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 320px; 
              margin: 0 auto; 
              padding: 24px;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 20px; font-weight: bold; }
            .header p { margin: 4px 0 0; font-size: 12px; }
            .info { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #000; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
            .items { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #000; }
            .total { font-weight: bold; display: flex; justify-content: space-between; font-size: 16px; margin-top: 12px; }
            .footer { text-align: center; margin-top: 32px; font-size: 11px; }
            @media print {
              body { width: 100%; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NGXLAB</h1>
            <p>Smart Order System</p>
            <p>Bukti Pembayaran</p>
          </div>
          <div class="info">
            <div class="info-row"><span>No. Transaksi:</span><span>${trx.id}</span></div>
            <div class="info-row"><span>Meja:</span><span>${trx.table}</span></div>
            <div class="info-row"><span>Tipe:</span><span>${trx.type || 'ngolab'}</span></div>
            <div class="info-row"><span>Metode Bayar:</span><span>${trx.paymentMethod || 'Tunai'}</span></div>
            <div class="info-row"><span>Waktu:</span><span>${trx.time}</span></div>
            <div class="info-row"><span>Status:</span><span>${(trx.status === 'Siap Disajikan' || trx.status === 'Selesai') ? 'LUNAS' : 'PENDING'}</span></div>
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

  const filteredTransactions = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        order.table.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'Semua' || 
        (statusFilter === 'Success' && (order.status === 'Selesai' || order.status === 'Siap Disajikan')) || 
        (statusFilter === 'Pending' && order.status === 'Menunggu');
      
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
  }, [orders, effectiveSearchTerm, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearchTerm, statusFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Histori Transaksi</h2>
          <p className="text-xs text-neutral-500 mt-1">
            {filteredTransactions.length} transaksi ditemukan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input 
              placeholder="Cari transaksi..." 
              className="pl-10 bg-white border-stone-200 w-full md:w-80"
              value={effectiveSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className={cn("gap-2 border-stone-200", statusFilter !== 'Semua' && "bg-orange-50 border-orange-200 text-orange-700")}>
                  <Filter size={18} />
                  {statusFilter === 'Semua' ? 'Filter' : statusFilter}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
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
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <input 
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setDateFilter(e.target.value)}
              value={dateFilter}
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
                className="absolute -top-2 -right-2 bg-stone-900 text-white rounded-full p-0.5 z-10 hover:bg-stone-800"
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

      <Card className="border border-neutral-200 bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-neutral-100">
                <TableHead className="w-16 text-center">No</TableHead>
                <TableHead>Tipe Pesanan</TableHead>
                <TableHead>Metode Bayar</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Meja / Lokasi</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((trx, idx) => (
                  <TableRow key={trx.id} className="border-neutral-50 hover:bg-neutral-50">
                    <TableCell className="text-center text-neutral-500 text-sm">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "font-bold text-[10px] border-neutral-200",
                        trx.type === 'POS' ? "text-blue-600 bg-blue-50 border-blue-200" : "text-neutral-700 bg-neutral-100 border-neutral-200"
                      )}>
                        {trx.type || 'ngolab'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold text-xs bg-neutral-100 text-neutral-700 border-none">
                        {trx.paymentMethod || 'Tunai'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-neutral-900 font-medium">{trx.time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-neutral-900 font-medium">{trx.table}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-neutral-900">
                        Rp {(trx.total || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          "border-none font-semibold",
                          (trx.status === 'Selesai' || trx.status === 'Siap Disajikan') ? "bg-neutral-200 text-neutral-800" : "bg-neutral-100 text-neutral-700"
                        )}
                      >
                        {(trx.status === 'Selesai' || trx.status === 'Siap Disajikan') ? 'Success' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {trx.paymentProofUrl ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 text-xs border-stone-200"
                          onClick={() => setPreviewImage(trx.paymentProofUrl || null)}
                        >
                          <Eye size={14} className="mr-1" /> Lihat
                        </Button>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {trx.voucherCode ? (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md">
                            {trx.rewardName || 'Voucher'} - {trx.pointsSpent || 0} Pts
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 block">
                            {trx.voucherCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-neutral-400 hover:text-neutral-700"
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
                          className="h-8 w-8 text-neutral-400 hover:text-neutral-700"
                          onClick={() => handlePrintReceipt(trx)}
                        >
                          <Printer size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState
                      icon={<Search size={48} className="text-neutral-300" />}
                      title="Tidak ada transaksi ditemukan"
                      description={
                        effectiveSearchTerm || statusFilter !== 'Semua' || dateFilter
                          ? "Coba ubah kata kunci pencarian atau filter Anda."
                          : "Belum ada transaksi yang tercatat."
                      }
                      action={
                        (effectiveSearchTerm || statusFilter !== 'Semua' || dateFilter) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setLocalSearchTerm('');
                              setStatusFilter('Semua');
                              setDateFilter('');
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Halaman <span className="font-semibold text-stone-900">{currentPage}</span> dari <span className="font-semibold text-stone-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 border-stone-200"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 border-stone-200"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detail Transaksi
              <Badge className={cn(
                "border-none",
                (selectedTrx?.status === 'Selesai' || selectedTrx?.status === 'Siap Disajikan') ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              )}>
                {(selectedTrx?.status === 'Selesai' || selectedTrx?.status === 'Siap Disajikan') ? 'Success' : 'Pending'}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedTrx && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">ID Transaksi</p>
                <p className="text-lg font-bold text-neutral-900 font-mono">{selectedTrx.id}</p>
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
                <div>
                  <p className="text-xs text-stone-400 font-medium">Tipe Pesanan</p>
                  <p className="text-stone-900 font-bold">{selectedTrx.type || 'ngolab'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">Metode Bayar</p>
                  <p className="text-stone-900 font-bold">{selectedTrx.paymentMethod || 'Tunai'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Item Pesanan</p>
                <div className="space-y-2">
                  {selectedTrx.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        <span className="font-bold text-neutral-900">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="text-neutral-900 font-medium">Rp {((item.price || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                <p className="text-base font-bold text-neutral-900">Total Pembayaran</p>
                <p className="text-xl font-bold text-neutral-900">Rp {(selectedTrx.total || 0).toLocaleString()}</p>
              </div>

                {selectedTrx.paymentProofUrl && (
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Bukti Pembayaran</p>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "border-none",
                      selectedTrx.paymentProofStatus === 'approved' ? "bg-green-100 text-green-700" :
                      selectedTrx.paymentProofStatus === 'rejected' ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    )}>
                      {selectedTrx.paymentProofStatus === 'approved' ? 'Disetujui' :
                       selectedTrx.paymentProofStatus === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </Badge>
                    {selectedTrx.paymentProofStatus === 'pending' && (
                      <div className="flex gap-2 ml-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => onVerifyPaymentProof?.(selectedTrx.id, 'rejected')}
                        >
                          <XCircle size={14} /> Tolak
                        </Button>
                        <Button 
                          size="sm" 
                          className="gap-1 bg-green-700 hover:bg-green-800"
                          onClick={() => onVerifyPaymentProof?.(selectedTrx.id, 'approved')}
                        >
                          <CheckCircle size={14} /> Terima
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    onClick={() => setPreviewImage(selectedTrx.paymentProofUrl)}
                  >
                    <Eye size={16} /> Lihat Bukti Pembayaran
                  </Button>
                </div>
              )}
              
              {selectedTrx.voucherCode && (
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Voucher Reward</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md">
                      {selectedTrx.voucherCode}
                    </span>
                  </div>
                </div>
              )}
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

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-[600px] p-2">
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Bukti Pembayaran" 
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Gagal+memuat+gambar';
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
