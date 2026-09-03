import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { apiFetch } from '@/lib/apiFetch';

// We will calculate these dynamically from the real orders data

interface DashboardProps {
  menuItems: any[];
  orders: any[];
  stockItems: any[];
}

export function Dashboard({ menuItems, orders, stockItems }: DashboardProps) {
  const [tables, setTables] = React.useState<any[]>([]);

  React.useEffect(() => {
    apiFetch('/api/smart-tags')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setTables(data);
      })
      .catch(err => console.error("Gagal mengambil data meja:", err));
  }, []);

  // Total Pendapatan
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  
  // Total Transaksi Hari Ini
  const today = new Date().toLocaleDateString('id-ID');
  const todayOrders = orders.filter(order => order.date === today);
  const todayRevenue = todayOrders.reduce((acc, order) => acc + order.total, 0);
  
  // Hitung Data Penjualan (7 Hari Terakhir)
  const salesData = React.useMemo(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dataMap = new Map();
    
    // Inisialisasi 7 hari terakhir
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateString = d.toLocaleDateString('id-ID');
      dataMap.set(dateString, { name: dayName, total: 0, scans: 0 });
    }

    orders.forEach(order => {
      if (dataMap.has(order.date)) {
        const existing = dataMap.get(order.date);
        existing.total += order.total;
        existing.scans += 1; // Anggap 1 pesanan = 1 scan untuk penyederhanaan
        dataMap.set(order.date, existing);
      }
    });

    return Array.from(dataMap.values());
  }, [orders]);

  const totalScans = salesData.reduce((acc, curr) => acc + curr.scans, 0);

  // Hitung Performa Zona (Zone Performance)
  const zonePerformance = React.useMemo(() => {
    const zoneMap: Record<string, number> = {};
    
    // Default zones
    tables.forEach(table => {
      if (!zoneMap[table.zone]) zoneMap[table.zone] = 0;
    });

    orders.forEach(order => {
      // Cari zona meja dari order
      const tableInfo = tables.find(t => t.number === order.table || `Meja ${t.number}` === order.table);
      const zoneName = tableInfo ? tableInfo.zone : 'Tanpa Zona';
      
      if (!zoneMap[zoneName]) zoneMap[zoneName] = 0;
      zoneMap[zoneName] += order.total;
    });

    return Object.entries(zoneMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Urutkan dari terbesar
  }, [orders, tables]);
  
  const stats = [
    {
      title: "Total Omset (All Time)",
      value: `Rp ${(totalRevenue || 0).toLocaleString()}`,
      description: "Pendapatan keseluruhan",
      icon: DollarSign,
    },
    {
      title: "Pesanan Hari Ini",
      value: todayOrders.length.toString(),
      description: `Rp ${todayRevenue.toLocaleString()}`,
      icon: ShoppingBag,
    },
    {
      title: "Rata-rata Order",
      value: `Rp ${(totalRevenue / (orders.length || 1) || 0).toLocaleString()}`,
      description: "-3.2% penurunan kecil",
      icon: TrendingUp,
    },
    {
      title: "Item Stok Kritis",
      value: stockItems.filter(i => i.status === 'critical').length.toString(),
      description: "Perlu restock segera",
      icon: ShoppingBag,
    }
  ];

  // Dynamic Recommendations Logic
  const criticalItems = stockItems.filter(i => i.status === 'critical');
  const conversionRate = (orders.length / (totalScans || 1)) * 100;
  
  const getDynamicRecommendations = () => {
    const recs = [];
    
    // Condition 1: Low Stock for Popular Items
    if (criticalItems.length > 0) {
      recs.push({
        type: 'danger',
        title: "Segera Restock Item Utama",
        description: `Stok ${criticalItems[0].name} dan ${criticalItems.length} item lainnya di bawah ambang batas aman. Segera hubungi supplier!`,
        icon: ShoppingBag,
        action: "LIHAT INVENTORI"
      });
    }

    // Condition 2: Analisis Menu (Terlaris & Kurang Laku)
    const itemCounts: Record<string, { count: number, revenue: number }> = {};
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        if (!itemCounts[item.name]) itemCounts[item.name] = { count: 0, revenue: 0 };
        itemCounts[item.name].count += Number(item.quantity);
        itemCounts[item.name].revenue += (Number(item.price) * Number(item.quantity));
      });
    });

    const sortedItems = Object.entries(itemCounts).sort((a, b) => b[1].count - a[1].count);
    
    if (sortedItems.length > 0) {
      const topItem = sortedItems[0];
      recs.push({
        type: 'success',
        title: `Bintang Menu: ${topItem[0]}`,
        description: `Terjual paling banyak (${topItem[1].count} porsi). Pertimbangkan membuat "Paket Bundling" menu ini dengan minuman untuk melipatgandakan omset!`,
        icon: TrendingUp,
        action: "BUAT PAKET MENU"
      });

      if (sortedItems.length >= 3) {
        const bottomItem = sortedItems[sortedItems.length - 1];
        // Jika menu terbawah terjual sangat sedikit dibanding menu teratas
        if (bottomItem[1].count < (topItem[1].count * 0.2)) {
          recs.push({
            type: 'warning',
            title: `Evaluasi Menu: ${bottomItem[0]}`,
            description: `Sangat jarang dipesan (hanya ${bottomItem[1].count} porsi). Coba berikan diskon, ubah resep, atau perbaiki fotonya di Smart Tag.`,
            icon: ShoppingBag,
            action: "EDIT MENU"
          });
        }
      }
    }

    // Condition 3: Analisis Jam Sibuk (Peak Hours)
    const hourCounts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.time) {
        // Asumsi format waktu "14:30" atau "14.30"
        const hour = order.time.replace('.', ':').split(':')[0]; 
        if (!hourCounts[hour]) hourCounts[hour] = 0;
        hourCounts[hour]++;
      }
    });

    const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    if (sortedHours.length > 0) {
      const peakHour = sortedHours[0][0];
      recs.push({
         type: 'info',
         title: `Bersiap Jam Sibuk (${peakHour}:00 - ${parseInt(peakHour)+1}:00)`,
         description: `Banyak transaksi terjadi di sekitar jam ${peakHour}:00. Pastikan bahan baku sudah disiapkan sebelumnya agar KDS tidak menumpuk.`,
         icon: Users,
         action: "LIHAT KDS"
      });
    }

    // Condition 3: Zone Performance
    if (zonePerformance.length >= 2) {
      const topZone = zonePerformance[0];
      const lowZone = zonePerformance[zonePerformance.length - 1];
      
      if (topZone.value > 0 && lowZone.value === 0) {
        recs.push({
          type: 'info',
          title: `Tingkatkan Pesanan di: ${lowZone.name}`,
          description: `Belum ada pesanan dari ${lowZone.name}. Pastikan Smart Tag di area tersebut mudah terlihat oleh pelanggan.`,
          icon: Users,
          action: "BUAT PROMO ZONA"
        });
      } else if (topZone.value > lowZone.value * 2 && lowZone.value > 0) {
        recs.push({
          type: 'info',
          title: `Pemerataan Area: ${lowZone.name}`,
          description: `Pendapatan di ${lowZone.name} tertinggal jauh dari ${topZone.name}. Berikan promo khusus zona ini.`,
          icon: Users,
          action: "BUAT PROMO ZONA"
        });
      }
    }

    return recs.slice(0, 4); // Menampilkan maksimal 4 rekomendasi terpenting
  };

  const dynamicRecs = getDynamicRecommendations();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 leading-tight">Analitik Bisnis</h1>
          <p className="text-xs text-neutral-500">Pantau performa KPI dan ambil keputusan berbasis data.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-neutral-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {stat.title}
              </CardTitle>
              <div className="p-1.5 rounded-md bg-neutral-100">
                <stat.icon className="h-4 w-4 text-neutral-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-neutral-900">{stat.value}</div>
              <p className="text-[10px] text-neutral-500 mt-1 font-medium">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border border-neutral-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Tren Transaksi Smart Tag</CardTitle>
              <CardDescription className="text-[11px] text-neutral-500">
                Perbandingan scan dan konversi order mingguan.
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-[10px] font-semibold text-neutral-500">Order</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                <span className="text-[10px] font-semibold text-neutral-500">Scan</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-1">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#737373', fontSize: 11, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#737373', fontSize: 11}}
                    tickFormatter={(value) => value >= 1000000 ? `${value/1000000}jt` : value}
                  />
                  <Tooltip 
                    cursor={{fill: '#fafafa'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px' }}
                    labelStyle={{ fontWeight: 700, marginBottom: '4px', color: '#171717' }}
                  />
                  <Bar 
                    dataKey="total" 
                    name="Pendapatan"
                    fill="#ea580c" 
                    radius={[3, 3, 0, 0]} 
                    barSize={18}
                  />
                  <Bar 
                    dataKey="scans" 
                    name="Total Scan"
                    fill="#a3a3a3" 
                    radius={[3, 3, 0, 0]} 
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Status Ketersediaan Stok</CardTitle>
            <CardDescription className="text-[11px] text-neutral-500">
              Monitor sisa item vs ambang batas aman.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 mt-2">
              {stockItems.slice(0, 5).map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold text-neutral-700">{item.name}</span>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded",
                      item.status === 'critical' ? "bg-red-50 text-red-600" : 
                      item.status === 'warning' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                    )}>
                      {item.qty} {item.unit.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        item.status === 'critical' ? "bg-red-500" : 
                        item.status === 'warning' ? "bg-orange-500" : "bg-green-500"
                      )}
                      style={{ width: `${Math.min(100, (item.qty / (item.min * 3 || 100)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-3 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                <span className="font-bold">Proyeksi:</span> Berdasarkan tren sabtu-minggu, stok <span className="underline italic">Mie Ayam</span> diprediksi habis sebelum jam 7 malam ini.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest pl-1">Rekomendasi Bisnis</h2>
          
          {dynamicRecs.map((rec, i) => (
            <Card key={i} className={cn(
              "border-none shadow-sm",
              rec.type === 'danger' ? "bg-gradient-to-br from-red-500 to-red-600 text-white" :
              rec.type === 'warning' ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white" :
              rec.type === 'success' ? "bg-gradient-to-br from-green-500 to-green-600 text-white" :
              "bg-white"
            )}>
              <CardContent className="p-5 space-y-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  rec.type === 'info' ? "bg-stone-100" : "bg-white/20"
                )}>
                  <rec.icon className={cn("h-5 w-5", rec.type === 'info' ? "text-stone-600" : "text-white")} />
                </div>
                <div>
                  <p className={cn("font-bold text-lg leading-tight mb-1", rec.type === 'info' ? "text-stone-900" : "text-white")}>
                    {rec.title}
                  </p>
                  <p className={cn("text-xs", rec.type === 'info' ? "text-stone-500" : "text-stone-100")}>
                    {rec.description}
                  </p>
                </div>
                {rec.action && (
                  <button 
                    onClick={() => toast.info(`Membuka: ${rec.action}`)}
                    className={cn(
                      "text-[10px] font-bold mt-2",
                      rec.type === 'info' ? "text-orange-600 hover:underline" : "text-white underline"
                    )}
                  >
                    {rec.action} →
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="md:col-span-2 border border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Produktivitas Layanan per Zona</CardTitle>
            <CardDescription className="text-[11px] text-neutral-500">
              Distribusi nilai transaksi berdasarkan area fisik restoran.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zonePerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#737373', fontSize: 11, fontWeight: 700}}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#fafafa'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#171717" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {zonePerformance.map((zone, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">{zone.name}</p>
                  <p className="text-xs font-semibold text-neutral-900">Rp {zone.value >= 1000000 ? `${(zone.value/1000000).toFixed(1)}jt` : zone.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
