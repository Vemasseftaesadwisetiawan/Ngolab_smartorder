import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical, 
  Reply,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/apiFetch';
import { EmptyState } from '@/components/ui/empty-state';

interface Rating {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'Published' | 'Pending' | 'Reported';
  orderId: string;
  reply?: string;
  menuId?: number | null;
  menuName?: string | null;
}

export function RatingManagement() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [ratingFilter, setRatingFilter] = useState<number | 'Semua'>('Semua');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/ratings');
        const data = await res.json();
        if (!data.error) {
          setRatings(data);
        } else {
          toast.error(data.message || 'Gagal memuat data rating');
        }
      } catch (err) {
        console.error('Gagal mengambil data rating:', err);
        toast.error('Tidak dapat terhubung ke server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, []);

  const averageRating = useMemo(() => {
    if (ratings.length === 0) return '0.0';
    return (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1);
  }, [ratings]);

  const filteredRatings = ratings.filter(r => {
    const matchesSearch = 
      r.comment.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua' || r.status === statusFilter;
    const matchesRating = ratingFilter === 'Semua' || r.rating === ratingFilter;
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleUpdateStatus = async (id: string, newStatus: Rating['status']) => {
    try {
      const response = await apiFetch(`/api/ratings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Gagal update di server');
      
      setRatings(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Status rating berhasil diubah menjadi ${newStatus}`);
    } catch (err) {
      toast.error("Gagal mengubah status di database");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiFetch(`/api/ratings/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Gagal hapus di server');

      setRatings(prev => prev.filter(r => r.id !== id));
      toast.success("Rating berhasil dihapus dari database");
    } catch (err) {
      toast.error("Gagal menghapus rating");
    }
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) {
      toast.error('Balasan tidak boleh kosong');
      return;
    }
    try {
      const response = await apiFetch(`/api/ratings/${id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ reply: replyText })
      });
      if (!response.ok) throw new Error('Gagal mengirim balasan');
      
      setRatings(prev => prev.map(r => r.id === id ? { ...r, reply: replyText } : r));
      setReplyingId(null);
      setReplyText('');
      toast.success("Balasan ulasan berhasil disimpan!");
    } catch (err) {
      toast.error("Gagal menyimpan balasan ulasan");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">Diterbitkan</span>;
      case 'Pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">Tertunda</span>;
      case 'Reported':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-200 text-neutral-800 border border-neutral-300">Dilaporkan</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-neutral-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Kelola Rating & Ulasan</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Pantau dan moderasi ulasan pelanggan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-neutral-100 px-3 py-2 rounded-md border border-neutral-200 flex items-center gap-2">
            <Star size={16} className="text-neutral-600" fill="currentColor" />
            <div className="text-left">
              <p className="text-[10px] font-semibold text-neutral-500">Rata-rata</p>
              <p className="text-base font-bold text-neutral-900 leading-none">{averageRating}</p>
            </div>
          </div>
          <div className="bg-neutral-50 px-3 py-2 rounded-md border border-neutral-200">
            <p className="text-[10px] font-semibold text-neutral-500">Total Ulasan</p>
            <p className="text-base font-bold text-neutral-900 leading-none">{ratings.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input 
            placeholder="Cari ulasan, pelanggan, atau order..." 
            className="pl-10 bg-white border-neutral-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className="gap-2 border-neutral-200">
                <Filter size={18} />
                {statusFilter !== 'Semua' ? `Filter: ${statusFilter}` : 'Filter'}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('Semua')}>
                <CheckCircle2 size={14} className="mr-2 text-stone-400" />
                Semua Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Published')}>
                <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
                Diterbitkan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Pending')}>
                <Clock size={14} className="mr-2 text-amber-500" />
                Tertunda
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Reported')}>
                <AlertCircle size={14} className="mr-2 text-red-500" />
                Dilaporkan
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Rating</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setRatingFilter('Semua')}>
                <Star size={14} className="mr-2 text-stone-400" />
                Semua Bintang
              </DropdownMenuItem>
              {[5, 4, 3, 2, 1].map(num => (
                <DropdownMenuItem key={num} onClick={() => setRatingFilter(num)}>
                  <div className="flex items-center gap-1 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < num ? "text-amber-400 fill-amber-400" : "text-stone-200"} 
                      />
                    ))}
                  </div>
                  {num} Bintang
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead className="w-12 text-center">Rating</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Ulasan</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
                    <p className="text-sm text-neutral-500">Memuat data rating...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRatings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<MessageSquare size={48} className="text-neutral-300" />}
                    title="Ulasan tidak ditemukan"
                    description={
                      searchTerm || statusFilter !== 'Semua' || ratingFilter !== 'Semua'
                        ? "Coba ubah kata kunci pencarian atau filter Anda."
                        : "Belum ada ulasan dari pelanggan saat ini."
                    }
                    action={
                      (searchTerm || statusFilter !== 'Semua') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('Semua');
                            setRatingFilter('Semua');
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
              filteredRatings.map((rating) => (
                <TableRow key={rating.id} className="hover:bg-neutral-50">
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="font-bold text-neutral-900 text-sm">{rating.rating}</span>
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-neutral-900 text-sm">{rating.customerName}</p>
                      <p className="text-xs text-neutral-500">Order #{rating.orderId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-neutral-700 line-clamp-2">"{rating.comment}"</p>
                      {rating.menuName && (
                        <p className="text-[10px] text-neutral-400 mt-1">Menu: {rating.menuName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-neutral-600">#{rating.orderId}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(rating.status)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-neutral-500">{rating.date}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-700">
                            <MoreVertical size={16} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                          {!rating.reply && rating.status === 'Published' && replyingId !== rating.id && (
                            <DropdownMenuItem onClick={() => {
                              setReplyingId(rating.id);
                              setReplyText('');
                            }}>
                              <Reply size={14} className="mr-2 text-neutral-700" />
                              Balas
                            </DropdownMenuItem>
                          )}
                          {rating.status !== 'Published' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(rating.id, 'Published')}>
                              <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
                              Terbitkan
                            </DropdownMenuItem>
                          )}
                          {rating.status !== 'Pending' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(rating.id, 'Pending')}>
                              <Clock size={14} className="mr-2 text-amber-500" />
                              Kembalikan ke Tertunda
                            </DropdownMenuItem>
                          )}
                          {rating.status !== 'Reported' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(rating.id, 'Reported')} className="text-red-600">
                              <AlertCircle size={14} className="mr-2" />
                              Laporkan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(rating.id)} className="text-red-600">
                            Hapus Rating
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && filteredRatings.length > 0 && (
        <div className="text-sm text-neutral-500 flex items-center justify-between">
          <span>
            Menampilkan <span className="font-semibold text-neutral-900">{filteredRatings.length}</span> dari <span className="font-semibold text-neutral-900">{ratings.length}</span> ulasan
          </span>
          {statusFilter !== 'Semua' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStatusFilter('Semua')}
              className="text-neutral-700 hover:text-neutral-800"
            >
              Reset Filter
            </Button>
          )}
        </div>
      )}

      <Dialog open={!!replyingId} onOpenChange={(open) => !open && setReplyingId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Balas Ulasan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reply">Balasan</Label>
              <Textarea
                id="reply"
                placeholder="Tulis balasan Anda..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setReplyingId(null);
              setReplyText('');
            }}>
              Batal
            </Button>
            <Button 
              onClick={() => replyingId && handleSendReply(replyingId)}
              className="bg-neutral-900 hover:bg-neutral-800"
            >
              Kirim Balasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
