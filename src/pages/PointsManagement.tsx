import React, { useState } from 'react';
import { 
  Coins, 
  Settings2, 
  Gift, 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Trophy,
  ArrowRightLeft,
  CircleDollarSign,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface Reward {
  id: string;
  name: string;
  points: number;
  description: string;
  status: 'Tersedia' | 'Habis';
}

interface PointRules {
  earningRate: number;
  minPurchase: number;
}

interface CustomerPoint {
  id: string;
  name: string;
  email: string;
  points: number;
  lastTransaction: string;
}

export function PointsManagement() {
  const [activeTab, setActiveTab] = useState<'rules' | 'catalog' | 'customers' | 'history'>('rules');
  
  // Point Rules State
  const [rules, setRules] = useState<PointRules>({
    earningRate: 1000, 
    minPurchase: 10000,
  });

  // History State representing integrated sources
  const [pointHistory, setPointHistory] = useState([
    { id: 'h1', customerName: 'Budi Darmawan', points: +50, source: 'Game Reward', date: '2024-05-11 14:20' },
    { id: 'h2', customerName: 'Siti Sarah', points: +25, source: 'AI Gesture Order', date: '2024-05-11 12:45' },
    { id: 'h3', customerName: 'Andi Wijaya', points: +100, source: 'POS Transaction', date: '2024-05-11 11:30' },
    { id: 'h4', customerName: 'Budi Darmawan', points: -50, source: 'Redeemed (Es Teh)', date: '2024-05-11 10:15' },
  ]);

  // Reward Catalog State
  const [rewards, setRewards] = useState<Reward[]>([
    { id: '1', name: 'Es Teh Manis', points: 50, description: 'Tukarkan 50 poin untuk 1 gelas Es Teh Manis', status: 'Tersedia' },
    { id: '2', name: 'Voucher Rp 10.000', points: 100, description: 'Potongan harga langsung sebesar Rp 10.000', status: 'Tersedia' },
    { id: '3', name: 'Bakso Malang Gratis', points: 250, description: 'Tukarkan 250 poin untuk 1 porsi Bakso Malang', status: 'Tersedia' },
  ]);

  // Customers Points State
  const [customers, setCustomers] = useState<CustomerPoint[]>([
    { id: '1', name: 'Budi Darmawan', email: 'budi@gmail.com', points: 450, lastTransaction: '2024-05-10' },
    { id: '2', name: 'Siti Sarah', email: 'sitsarah@outlook.com', points: 120, lastTransaction: '2024-05-11' },
    { id: '3', name: 'Andi Wijaya', email: 'andi.w@yahoo.com', points: 890, lastTransaction: '2024-05-08' },
    { id: '4', name: 'Dewi Lestari', email: 'dewi.les@gmail.com', points: 30, lastTransaction: '2024-05-01' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);

  const handleUpdateRules = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const earningRate = Number(formData.get('earningRate'));
    const minPurchase = Number(formData.get('minPurchase'));

    setRules({ earningRate, minPurchase });
    toast.success("Aturan poin berhasil diperbarui");
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const points = Number(formData.get('points'));
    const description = formData.get('description') as string;

    const newReward: Reward = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      points,
      description,
      status: 'Tersedia'
    };

    setRewards(prev => [...prev, newReward]);
    toast.success(`Hadiah "${name}" berhasil ditambahkan`);
    setIsAddRewardOpen(false);
  };

  const deleteReward = (id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id));
    toast.error("Hadiah berhasil dihapus from catalog");
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'rules' ? "border-orange-600 text-orange-600" : "border-transparent text-stone-500 hover:text-stone-700"
          )}
        >
          <Settings2 size={18} />
          Aturan Poin
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'catalog' ? "border-orange-600 text-orange-600" : "border-transparent text-stone-500 hover:text-stone-700"
          )}
        >
          <Gift size={18} />
          Katalog Hadiah
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'customers' ? "border-orange-600 text-orange-600" : "border-transparent text-stone-500 hover:text-stone-700"
          )}
        >
          <Users size={18} />
          Poin Pelanggan
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'history' ? "border-orange-600 text-orange-600" : "border-transparent text-stone-500 hover:text-stone-700"
          )}
        >
          <ArrowRightLeft size={18} />
          Riwayat Integrasi
        </button>
      </div>

      {activeTab === 'rules' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <CircleDollarSign className="text-orange-600" />
                Konfigurasi Perolehan Poin
              </CardTitle>
              <CardDescription>
                Tentukan bagaimana pelanggan mendapatkan poin dari setiap transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRules} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="earningRate">Nilai Poin (Tiap Rp belanja)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">1 Poin / </span>
                    <Input 
                      id="earningRate" 
                      name="earningRate" 
                      type="number" 
                      defaultValue={rules.earningRate}
                      className="pl-24 font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400">Contoh: Jika diisi 1000, maka Rp 10.000 belanja = 10 Poin.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Minimal Belanja (Rp)</Label>
                  <Input 
                    id="minPurchase" 
                    name="minPurchase" 
                    type="number" 
                    defaultValue={rules.minPurchase}
                    className="font-bold"
                  />
                  <p className="text-[11px] text-stone-400">Minimal total belanja untuk mendapatkan poin.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 text-xs font-bold uppercase tracking-wider">Info Integrasi</p>
                    <p className="text-blue-800/80 text-[11px]">
                      Poin dari <strong>Aplikasi Game</strong> dan <strong>AI Gesture</strong> akan dihitung berdasarkan aturan ini jika tidak ditentukan secara custom melalui API.
                    </p>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800">
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-orange-50 border-orange-100">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-900 flex items-center gap-2">
                  <Info size={18} />
                  Simulasi Poin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-orange-100 text-sm">
                  <span className="text-stone-500">Belanja Rp 55.000</span>
                  <ArrowRightLeft size={16} className="text-stone-300" />
                  <span className="font-bold text-orange-600">{Math.floor(55000 / rules.earningRate)} Poin</span>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-orange-100 text-sm">
                  <span className="text-stone-500">Belanja Rp 120.000</span>
                  <ArrowRightLeft size={16} className="text-stone-300" />
                  <span className="font-bold text-orange-600">{Math.floor(120000 / rules.earningRate)} Poin</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-stone-900 text-white overflow-hidden relative">
              <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy size={18} className="text-orange-400" />
                  Total Poin Beredar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-400">
                  {customers.reduce((sum, c) => sum + c.points, 0).toLocaleString()}
                </p>
                <p className="text-stone-400 text-xs mt-1">Total poin yang dipegang oleh member saat ini.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-stone-900">Katalog Penukaran Hadiah</h3>
            <Dialog open={isAddRewardOpen} onOpenChange={setIsAddRewardOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-orange-600 hover:bg-orange-700 gap-2 rounded-xl">
                    <Plus size={18} />
                    Tambah Hadiah
                  </Button>
                }
              />
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Tambah Hadiah Katalog</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddReward} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Hadiah</Label>
                    <Input id="name" name="name" placeholder="Contoh: Voucher Diskon 20%" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Kebutuhan Poin</Label>
                    <Input id="points" name="points" type="number" placeholder="Contoh: 100" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input id="description" name="description" placeholder="Berikan detail penukaran..." required />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddRewardOpen(false)}>Batal</Button>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Hadiah</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id} className="border-none shadow-sm bg-white overflow-hidden group">
                <div className="h-1 bg-orange-500" />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-stone-900">{reward.name}</CardTitle>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold">
                      {reward.points} Poin
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-900">
                      <Edit2 size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-stone-400 hover:text-red-600"
                      onClick={() => deleteReward(reward.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-500 text-sm">{reward.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Data Poin Member</CardTitle>
              <CardDescription>Monitor dan kelola poin yang dimiliki pelanggan.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="Cari pelanggan..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-stone-100">
                    <th className="pb-4 font-bold text-stone-500 text-sm">Pelanggan</th>
                    <th className="pb-4 font-bold text-stone-500 text-sm">Total Poin</th>
                    <th className="pb-4 font-bold text-stone-500 text-sm">Update Terakhir</th>
                    <th className="pb-4 font-bold text-stone-500 text-sm text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-stone-50/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-400">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{customer.name}</p>
                            <p className="text-xs text-stone-400">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <Coins size={16} className="text-orange-500" />
                          <span className="font-bold text-stone-900">{customer.points.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-stone-500">
                        {customer.lastTransaction}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold gap-2">
                          <Plus size={14} /> Tambah Point
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="text-orange-600" />
              Log Aktivitas Poin Terintegrasi
            </CardTitle>
            <CardDescription>Melacak perolehan dan penukaran poin dari semua aplikasi ekosistem.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pointHistory.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl border border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      log.points > 0 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {log.source === 'Game Reward' && <Trophy size={18} />}
                      {log.source === 'AI Gesture Order' && <Coins size={18} />}
                      {log.source === 'POS Transaction' && <CircleDollarSign size={18} />}
                      {log.source.includes('Redeemed') && <Gift size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{log.customerName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold border-stone-200">
                          {log.source}
                        </Badge>
                        <span className="text-[11px] text-stone-400">{log.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "text-lg font-mono font-bold",
                    log.points > 0 ? "text-green-600" : "text-orange-600"
                  )}>
                    {log.points > 0 ? `+${log.points}` : log.points}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-stone-900 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white">Ringkasan Integrasi</h4>
                <div className="px-2 py-1 bg-green-500 text-[10px] font-bold text-white rounded uppercase tracking-tighter">
                  Status: Online
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Game</p>
                  <p className="text-white font-bold">128 Pts</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">AI Gesture</p>
                  <p className="text-white font-bold">45 Pts</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">POS</p>
                  <p className="text-white font-bold">894 Pts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
