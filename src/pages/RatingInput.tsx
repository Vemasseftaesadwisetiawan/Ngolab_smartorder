import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiFetch';

export function RatingInput() {
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) {
      toast.error('Semua data wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/ratings', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          rating,
          comment,
          orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          menuId: 1 // default menu
        })
      });

      if (response.ok) {
        toast.success('Rating berhasil dikirim');
        setCustomerName('');
        setRating(5);
        setComment('');
      } else {
        toast.error('Gagal mengirim rating');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 bg-neutral-900 rounded-md flex items-center justify-center text-white mb-3">
            <MessageSquare size={20} />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">Ulasan Pelanggan</h1>
          <p className="text-neutral-500 text-xs">Beri masukan untuk hidangan kami</p>
        </div>

        <Card className="border border-neutral-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Kirim Ulasan Baru</CardTitle>
            <CardDescription>Ulasan Anda akan dipublikasikan setelah disetujui Admin.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nama Lengkap</Label>
                <Input
                  id="customer-name"
                  placeholder="Masukkan nama Anda"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-10 border-neutral-200 focus:ring-neutral-400 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label>Rating Anda</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <span
                      key={starVal}
                      data-value={starVal}
                      onClick={() => setRating(starVal)}
                      className="cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={starVal <= rating ? "text-amber-400 fill-amber-400" : "text-neutral-200"}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Komentar / Ulasan</Label>
                <Textarea
                  id="comment"
                  placeholder="Tulis ulasan tentang hidangan..."
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px] border-neutral-200 focus:ring-neutral-400 rounded-md bg-white"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
