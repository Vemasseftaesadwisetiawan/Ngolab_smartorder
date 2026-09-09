import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Gift, 
  Settings2, 
  History, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Save, 
  Coins, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Filter,
  Sparkles,
  UserCheck,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/apiFetch';
import { EmptyState } from '@/components/ui/empty-state';

interface PointReward {
  id: number | string;
  name: string;
  points: number;
  points_required?: number;
  description: string;
  status: 'Tersedia' | 'Habis';
}

interface PointHistoryItem {
  id: number;
  user_id: number;
  customer_name: string;
  points: number;
  source: string;
  created_at: string;
}
interface UserOption {
  id: number;
  name: string;
  email: string;
  points: number;
}

const UserAddPointsRow = ({ user, onDone }: { user: UserOption; onDone: () => void }) => {
  const [amount, setAmount] = React.useState<number | ''>('');
  const [source, setSource] = React.useState('Penambahan manual admin');
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error('Jumlah poin tidak valid');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`/api/users/${user.id}/points`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          source,
          customerName: user.name
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Berhasil menambah ${Number(amount)} poin untuk ${user.name}`);
        setAmount('');
        setSource('Penambahan manual admin');
        onDone();
      } else {
        toast.error(data.error || 'Gagal menambah poin');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow className="hover:bg-neutral-50/80">
      <TableCell className="font-medium text-neutral-900">{user.name}</TableCell>
      <TableCell className="text-neutral-600 text-sm">{user.email}</TableCell>
      <TableCell className="text-right">
        <span className="font-bold font-mono text-xs">{user.points} Pts</span>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
          min={1}
          className="bg-white border-neutral-200 font-medium w-28"
        />
      </TableCell>
      <TableCell>
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
          className="bg-white border-neutral-200 font-medium"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={submit}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {saving ? 'Menyimpan...' : 'Tambah'}
        </Button>
      </TableCell>
    </TableRow>
  );
};

export function PointsManagement() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'settings' | 'history'>('rewards');
  
  // Settings State
  const [earningRate, setEarningRate] = useState<number>(1000);
  const [minPurchase, setMinPurchase] = useState<number>(10000);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Rewards State
  const [rewards, setRewards] = useState<PointReward[]>([]);
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<PointReward | null>(null);
  const [rewardName, setRewardName] = useState('');
  const [rewardPoints, setRewardPoints] = useState<number | ''>('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardStatus, setRewardStatus] = useState<'Tersedia' | 'Habis'>('Tersedia');
  const [rewardSearchTerm, setRewardSearchTerm] = useState('');

  // History State
  const [history, setHistory] = useState<PointHistoryItem[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Point Settings
  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/api/point-settings');
      const data = await res.json();
      if (!data.error) {
        setEarningRate(Number(data.earningRate) || 1000);
        setMinPurchase(Number(data.minPurchase) || 10000);
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan poin:', err);
    }
  };

  // Fetch Rewards Catalog
  const fetchRewards = async () => {
    try {
      const res = await apiFetch('/api/point-rewards');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRewards(data.map(r => ({
          id: r.id,
          name: r.name,
          points: Number(r.points || r.points_required || 0),
          description: r.description || '',
          status: r.status || 'Tersedia'
        })));
      }
    } catch (err) {
      console.error('Gagal mengambil katalog hadiah:', err);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    try {
      const res = await apiFetch('/api/point-history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat poin:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data.map(u => ({ id: u.id, name: u.name, email: u.email, points: Number(u.points || 0) })));
      }
    } catch (err) {
      console.error('Gagal mengambil data pengguna:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchRewards(), fetchHistory(), fetchUsers()]);
      setIsLoading(false);
    };
    loadAll();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await apiFetch('/api/point-settings', {
        method: 'POST',
        body: JSON.stringify({ earningRate, minPurchase })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Aturan poin loyalty berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan aturan poin");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Create or Update Reward
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardName || !rewardPoints) {
      toast.error("Nama dan jumlah poin wajib diisi");
      return;
    }

    const payload = {
      name: rewardName,
      points: Number(rewardPoints),
      description: rewardDescription,
      status: rewardStatus
    };

    if (editingReward) {
      try {
        const res = await apiFetch(`/api/point-rewards/${editingReward.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success || res.ok) {
          setRewards(prev => prev.map(r => r.id === editingReward.id ? { ...r, ...payload } : r));
          toast.success("Hadiah berhasil diperbarui!");
          setIsAddRewardOpen(false);
          setEditingReward(null);
          resetRewardForm();
        } else {
          toast.error("Gagal memperbarui hadiah");
        }
      } catch (err) {
        toast.error("Gagal menyimpan perubahan ke server");
      }
    } else {
      try {
        const res = await apiFetch('/api/point-rewards', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.id || res.ok) {
          const newReward: PointReward = {
            id: data.id || Math.random(),
            ...payload
          };
          setRewards(prev => [...prev, newReward]);
          toast.success("Hadiah baru berhasil ditambahkan!");
          setIsAddRewardOpen(false);
          resetRewardForm();
        } else {
          toast.error("Gagal menambahkan hadiah");
        }
      } catch (err) {
        toast.error("Gagal menyimpan hadiah baru");
      }
    }
  };

  // Delete Reward
  const handleDeleteReward = async (id: number | string) => {
    if (!confirm("Anda yakin ingin menghapus hadiah ini?")) return;
    try {
      const res = await apiFetch(`/api/point-rewards/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRewards(prev => prev.filter(r => r.id !== id));
        toast.success("Hadiah berhasil dihapus");
      } else {
        toast.error("Gagal menghapus hadiah");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server");
    }
  };

  const openEditReward = (reward: PointReward) => {
    setEditingReward(reward);
    setRewardName(reward.name);
    setRewardPoints(reward.points);
    setRewardDescription(reward.description);
    setRewardStatus(reward.status);
    setIsAddRewardOpen(true);
  };

  const resetRewardForm = () => {
    setRewardName('');
    setRewardPoints('');
    setRewardDescription('');
    setRewardStatus('Tersedia');
  };

  const filteredRewards = useMemo(() => {
    return rewards.filter(r => r.name.toLowerCase().includes(rewardSearchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(rewardSearchTerm.toLowerCase()));
  }, [rewards, rewardSearchTerm]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => 
      h.customer_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      h.source.toLowerCase().includes(historySearchTerm.toLowerCase())
    );
  }, [history, historySearchTerm]);

  const totalPointsDistributed = useMemo(() => {
    return history.reduce((sum, item) => sum + (item.points > 0 ? item.points : 0), 0);
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Kelola Poin & Rewards Loyalty</h2>
          <p className="text-xs text-neutral-500">Atur perolehan poin transaksi, katalog hadiah, dan pantau riwayat poin pelanggan.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border border-neutral-200 bg-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-500">Total Hadiah Aktif</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{rewards.length} Item</p>
              </div>
              <div className="p-2.5 bg-neutral-100 rounded-md">
                <Gift size={20} className="text-neutral-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 bg-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-500">Aturan Perolehan</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">1 Poin / Rp {earningRate.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-neutral-100 rounded-md">
                <Coins size={20} className="text-neutral-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 bg-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-500">Total Poin Diberikan</p>
                <p className="text-xl font-bold text-orange-600 mt-1">{totalPointsDistributed.toLocaleString()} Pts</p>
              </div>
              <div className="p-2.5 bg-orange-50 rounded-md">
                <Trophy size={20} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="bg-neutral-100 p-1 mb-4 inline-flex h-auto">
          <TabsTrigger value="rewards" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Gift size={16} /> Katalog Hadiah ({rewards.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings2 size={16} /> Aturan Poin
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History size={16} /> Riwayat Poin ({history.length})
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UserCheck size={16} /> Tambah Poin
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: REWARDS */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Cari hadiah..."
                value={rewardSearchTerm}
                onChange={(e) => setRewardSearchTerm(e.target.value)}
                className="pl-10 bg-white border-neutral-200"
              />
            </div>

            <Button
              className="gap-2 bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setEditingReward(null);
                resetRewardForm();
                setIsAddRewardOpen(true);
              }}
            >
              <Plus size={18} />
              Tambah Hadiah Baru
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className="border border-neutral-200 bg-white overflow-hidden flex flex-col justify-between">
                <div>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="text-base font-semibold text-neutral-900">{reward.name}</CardTitle>
                      <Badge className={cn(
                        "mt-1 font-semibold border-none text-[10px]",
                        reward.status === 'Tersedia' ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                      )}>
                        {reward.status}
                      </Badge>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-600">
                            <MoreVertical size={16} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuGroup>
                          <DropdownMenuItem className="gap-2" onClick={() => openEditReward(reward)}>
                            <Edit2 size={14} /> Edit Hadiah
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => handleDeleteReward(reward.id)}>
                            <Trash2 size={14} /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2">
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {reward.description || 'Tidak ada deskripsi tambahan.'}
                    </p>

                    <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 flex items-center justify-between">
                      <span className="text-xs text-neutral-500 font-medium">Poin Dibutuhkan:</span>
                      <span className="text-base font-bold text-orange-600 font-mono flex items-center gap-1">
                        <Coins size={16} /> {reward.points} Pts
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          {filteredRewards.length === 0 && (
            <Card className="border border-neutral-200 bg-white">
              <CardContent className="p-0">
                <EmptyState
                  icon={<Gift size={48} className="text-neutral-300" />}
                  title="Belum ada hadiah terdaftar"
                  description="Tambahkan hadiah baru yang dapat ditukarkan pelanggan dengan poin mereka."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: SETTINGS */}
        <TabsContent value="settings">
          <Card className="border border-neutral-200 bg-white max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 size={18} className="text-neutral-600" />
                Konfigurasi Aturan Poin Loyalty
              </CardTitle>
              <CardDescription>
                Tentukan bagaimana pelanggan mengumpulkan poin dari setiap transaksi yang berhasil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="earning-rate">Nilai Perolehan Poin (Rp)</Label>
                  <Input
                    id="earning-rate"
                    type="number"
                    value={earningRate}
                    onChange={(e) => setEarningRate(Number(e.target.value))}
                    required
                    min={1}
                    className="bg-white border-neutral-200 font-medium"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Pelanggan akan memperoleh <strong>1 Poin</strong> untuk setiap kelipatan Rp {earningRate.toLocaleString()}.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-purchase">Minimal Pembelian untuk Mendapat Poin (Rp)</Label>
                  <Input
                    id="min-purchase"
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                    required
                    min={0}
                    className="bg-white border-neutral-200 font-medium"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Transaksi dengan total di bawah nominal ini tidak akan mendapatkan poin.
                  </p>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isSavingSettings} className="bg-neutral-900 hover:bg-neutral-800 gap-2">
                    <Save size={16} /> {isSavingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ADD POINTS */}
        <TabsContent value="add" className="space-y-4">
          <Card className="border border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck size={18} className="text-neutral-600" />
                Tambah Poin Pelanggan
              </CardTitle>
              <CardDescription>
                Tambah poin manual ke akun pengguna aplikasi konsumen yang sudah terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-neutral-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                      <TableHead className="text-[11px] font-semibold text-neutral-500">Pelanggan</TableHead>
                      <TableHead className="text-[11px] font-semibold text-neutral-500">Email</TableHead>
                      <TableHead className="text-[11px] font-semibold text-neutral-500 text-right">Poin Saat Ini</TableHead>
                      <TableHead className="text-[11px] font-semibold text-neutral-500">Jumlah Poin</TableHead>
                      <TableHead className="text-[11px] font-semibold text-neutral-500">Sumber / Aktivitas</TableHead>
                      <TableHead className="text-[11px] font-semibold text-neutral-500 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <UserAddPointsRow key={u.id} user={u} onDone={fetchHistory} />
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-neutral-400">
                          Belum ada pengguna terdaftar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: HISTORY */}
        <TabsContent value="history" className="space-y-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Cari nama pelanggan atau transaksi..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="pl-10 bg-white border-neutral-200"
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="w-12 text-center text-[11px] font-semibold text-neutral-500">#</TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500">Pelanggan</TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500">Jumlah Poin</TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500">Sumber / Aktivitas</TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item, idx) => (
                  <TableRow key={item.id || idx} className="hover:bg-neutral-50/80">
                    <TableCell className="text-center text-neutral-500 text-sm">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-neutral-900">{item.customer_name}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1 font-bold font-mono text-xs px-2 py-0.5 rounded-md",
                        item.points >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {item.points >= 0 ? `+${item.points}` : item.points} Pts
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-600 text-sm">{item.source}</TableCell>
                    <TableCell className="text-neutral-500 text-xs">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}

                {filteredHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-neutral-400">
                      Belum ada riwayat aktivitas poin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Add/Edit Reward */}
      <Dialog open={isAddRewardOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddRewardOpen(false);
          setEditingReward(null);
          resetRewardForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveReward}>
            <DialogHeader>
              <DialogTitle>{editingReward ? 'Edit Hadiah Reward' : 'Tambah Hadiah Reward Baru'}</DialogTitle>
              <DialogDescription>
                Masukkan nama item dan poin yang diperlukan untuk penukaran.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reward-name">Nama Hadiah</Label>
                <Input
                  id="reward-name"
                  placeholder="Contoh: Voucher Diskon Rp 10.000 atau Es Teh Manis"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reward-points">Poin Diperlukan</Label>
                  <Input
                    id="reward-points"
                    type="number"
                    placeholder="50"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(Number(e.target.value))}
                    required
                    min={1}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reward-status">Status</Label>
                  <Select value={rewardStatus} onValueChange={(val: any) => setRewardStatus(val)}>
                    <SelectTrigger id="reward-status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tersedia">Tersedia</SelectItem>
                      <SelectItem value="Habis">Habis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reward-desc">Deskripsi</Label>
                <Textarea
                  id="reward-desc"
                  placeholder="Keterangan cara penukaran / syarat..."
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddRewardOpen(false);
                setEditingReward(null);
                resetRewardForm();
              }}>Batal</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                {editingReward ? 'Simpan Perubahan' : 'Tambah Hadiah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
