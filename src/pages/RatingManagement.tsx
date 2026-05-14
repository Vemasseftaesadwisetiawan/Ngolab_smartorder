import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  User, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Reply
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Rating {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'Published' | 'Pending' | 'Reported';
  orderId: string;
  reply?: string;
}

const initialRatings: Rating[] = [
  {
    id: 'R-001',
    customerName: 'Budi Santoso',
    rating: 5,
    comment: 'Bakso Malangnya enak banget! Kuahnya gurih dan isiannya lengkap.',
    date: '2024-03-20',
    status: 'Published',
    orderId: 'ORD-123',
    reply: 'Terima kasih Pak Budi! Ditunggu kedatangannya kembali.'
  },
  {
    id: 'R-002',
    customerName: 'Siti Aminah',
    rating: 4,
    comment: 'Mie Yaminnya pas manisnya. Cuma sayang tadi nunggu agak lama.',
    date: '2024-03-19',
    status: 'Published',
    orderId: 'ORD-124'
  },
  {
    id: 'R-003',
    customerName: 'Andi Wijaya',
    rating: 2,
    comment: 'Pangsitnya agak keras tadi. Tolong diperbaiki ya.',
    date: '2024-03-18',
    status: 'Reported',
    orderId: 'ORD-125'
  },
  {
    id: 'R-004',
    customerName: 'user_anonymous',
    rating: 5,
    comment: 'Pelayanan cepat dan ramah. Bakso gorengnya mantap!',
    date: '2024-03-17',
    status: 'Pending',
    orderId: 'ORD-126'
  }
];

export function RatingManagement() {
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [ratingFilter, setRatingFilter] = useState<number | 'Semua'>('Semua');

  const filteredRatings = ratings.filter(r => {
    const matchesSearch = r.comment.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || r.status === statusFilter;
    const matchesRating = ratingFilter === 'Semua' || r.rating === ratingFilter;
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleUpdateStatus = (id: string, newStatus: Rating['status']) => {
    setRatings(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast.success(`Status rating berhasil diubah menjadi ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    setRatings(prev => prev.filter(r => r.id !== id));
    toast.error("Rating berhasil dihapus");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-stone-900">Kelola Rating & Ulasan</h2>
        <div className="flex items-center gap-2">
          <div className="bg-orange-50 px-3 py-1 rounded-full text-orange-700 text-sm font-medium border border-orange-100 flex items-center gap-2">
            <Star size={14} fill="currentColor" />
            4.8 Rata-rata Rating
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input 
            placeholder="Cari ulasan atau pelanggan..." 
            className="pl-10 border-stone-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="gap-2 border-stone-200">
                  <Filter size={18} />
                  Filter
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Semua'} onCheckedChange={() => setStatusFilter('Semua')}>Semua Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Published'} onCheckedChange={() => setStatusFilter('Published')}>Diterbitkan</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Pending'} onCheckedChange={() => setStatusFilter('Pending')}>Tertunda</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Reported'} onCheckedChange={() => setStatusFilter('Reported')}>Dilaporkan</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Rating</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={ratingFilter === 'Semua'} onCheckedChange={() => setRatingFilter('Semua')}>Semua Bintang</DropdownMenuCheckboxItem>
                {[5, 4, 3, 2, 1].map(num => (
                  <DropdownMenuCheckboxItem key={num} checked={ratingFilter === num} onCheckedChange={() => setRatingFilter(num)}>
                    {num} Bintang
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRatings.length > 0 ? (
          filteredRatings.map((rating) => (
            <Card key={rating.id} className="border-stone-200 hover:border-orange-200 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900">{rating.customerName}</h4>
                        <p className="text-xs text-stone-500">{rating.date} • Pesanan {rating.orderId}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "ml-auto md:ml-0 font-normal",
                        rating.status === 'Published' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                        rating.status === 'Pending' && "bg-amber-50 text-amber-700 border-amber-100",
                        rating.status === 'Reported' && "bg-red-50 text-red-700 border-red-100",
                      )}>
                        {rating.status === 'Published' ? 'Diterbitkan' : rating.status === 'Pending' ? 'Tertunda' : 'Dilaporkan'}
                      </Badge>
                    </div>

                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          className={cn(i < rating.rating ? "text-amber-400 fill-amber-400" : "text-stone-200")} 
                        />
                      ))}
                    </div>

                    <p className="text-stone-700 italic">"{rating.comment}"</p>

                    {rating.reply && (
                      <div className="bg-stone-50 border-l-2 border-orange-200 p-3 mt-3 rounded-r-md">
                        <div className="flex items-center gap-2 mb-1">
                          <Reply size={14} className="text-orange-500" />
                          <span className="text-[10px] font-bold text-stone-900 uppercase">Balasan Pemilik</span>
                        </div>
                        <p className="text-sm text-stone-600">{rating.reply}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 md:flex-col md:justify-start">
                    {!rating.reply && rating.status === 'Published' && (
                      <Button variant="outline" size="sm" className="gap-2 border-stone-200 text-stone-600 w-full md:w-auto" onClick={() => toast.info("Fitur balas ulasan segera hadir!")}>
                        <Reply size={14} />
                        Balas
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="text-stone-400">
                            <MoreVertical size={18} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Tindakan</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {rating.status !== 'Published' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(rating.id, 'Published')}>
                              <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
                              Terbitkan
                            </DropdownMenuItem>
                          )}
                          {rating.status !== 'Reported' && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(rating.id, 'Reported')}>
                              <AlertCircle size={14} className="mr-2" />
                              Laporkan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50" onClick={() => handleDelete(rating.id)}>
                            Hapus Rating
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <MessageSquare size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-medium text-stone-900">Ulasan tidak ditemukan</h3>
            <p className="text-stone-500">Coba ubah kata kunci pencarian atau filter Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
