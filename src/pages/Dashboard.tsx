import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
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

const salesData = [
  { name: 'Sen', total: 1200000, scans: 45 },
  { name: 'Sel', total: 1500000, scans: 52 },
  { name: 'Rab', total: 1100000, scans: 38 },
  { name: 'Kam', total: 1800000, scans: 65 },
  { name: 'Jum', total: 2200000, scans: 80 },
  { name: 'Sab', total: 3500000, scans: 120 },
  { name: 'Min', total: 3800000, scans: 145 },
];

const zonePerformance = [
  { name: 'Lantai 1', value: 4500000 },
  { name: 'Area VIP', value: 2800000 },
  { name: 'Outdoor', value: 3200000 },
  { name: 'Bar Counter', value: 1500000 },
];

interface DashboardProps {
  menuItems: any[];
  orders: any[];
  stockItems: any[];
}

export function Dashboard({ menuItems, orders, stockItems }: DashboardProps) {
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const pendingOrders = orders.filter(order => order.status === 'Menunggu').length;
  const totalScans = salesData.reduce((acc, curr) => acc + curr.scans, 0);
  
  const stats = [
    {
      title: "Pendapatan Smart Tag",
      value: `Rp ${(totalRevenue || 0).toLocaleString()}`,
      description: "+12.5% vs minggu lalu",
      icon: DollarSign,
      trend: "up",
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      title: "Total Scan Hari Ini",
      value: "145",
      description: "+22% vs kemarin",
      icon: Users,
      trend: "up",
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Rata-rata Order",
      value: `Rp ${(totalRevenue / (orders.length || 1) || 0).toLocaleString()}`,
      description: "-3.2% penurunan kecil",
      icon: TrendingUp,
      trend: "down",
      color: "text-orange-600",
      bg: "bg-orange-100"
    },
    {
      title: "Item Stok Kritis",
      value: stockItems.filter(i => i.status === 'critical').length.toString(),
      description: "Perlu restock segera",
      icon: ShoppingBag,
      trend: "down",
      color: "text-red-600",
      bg: "bg-red-100"
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

    // Condition 2: High Scans but Low Conversion
    if (conversionRate < 50) {
      recs.push({
        type: 'warning',
        title: "Optimasi Konversi Menu",
        description: "Banyak pelanggan melakukan scan tapi tidak memesan. Coba tambahkan foto produk atau promo 'Menu Rekomendasi' di Smart Tag.",
        icon: TrendingUp,
        action: "EDIT MENU"
      });
    } else {
      recs.push({
        type: 'success',
        title: "Upselling Opportunity",
        description: "Konversi scan Anda sangat baik. Tambahkan 'Add-on' otomatis (seperti Ekstrak Kerupuk/Telur) untuk meningkatkan nilai per pesanan.",
        icon: DollarSign,
        action: "LIHAT ANALITIK PROMO"
      });
    }

    // Condition 3: Zone Performance
    const topZone = [...zonePerformance].sort((a, b) => b.value - a.value)[0];
    const lowZone = [...zonePerformance].sort((a, b) => a.value - b.value)[0];
    
    if (topZone.value > lowZone.value * 2) {
      recs.push({
        type: 'info',
        title: `Pemerataan Area: ${lowZone.name}`,
        description: `Pendapatan di ${lowZone.name} tertinggal jauh dari ${topZone.name}. Berikan promo khusus zona ini untuk menarik pelanggan ke area sepi.`,
        icon: Users,
        action: "BUAT PROMO ZONA"
      });
    }

    return recs.slice(0, 3); // Return top 3 relevant recs
  };

  const dynamicRecs = getDynamicRecommendations();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 leading-tight">Analitik Bisnis</h1>
          <p className="text-sm text-stone-500">Pantau performa KPI dan ambil keputusan berbasis data.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-stone-900">{stat.value}</div>
              <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1 font-medium">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.description.split(' ')[0]}
                </span>
                {stat.description.split(' ').slice(1).join(' ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Tren Transaksi Smart Tag</CardTitle>
              <CardDescription className="text-xs">
                Perbandingan scan dan konversi order mingguan.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                <span className="text-[10px] font-bold text-stone-500">Order</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                <span className="text-[10px] font-bold text-stone-500">Scan</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#78716c', fontSize: 11, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#78716c', fontSize: 11}}
                    tickFormatter={(value) => value >= 1000000 ? `${value/1000000}jt` : value}
                  />
                  <Tooltip 
                    cursor={{fill: '#fafaf9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 700, marginBottom: '4px', color: '#1c1917' }}
                  />
                  <Bar 
                    dataKey="total" 
                    name="Pendapatan"
                    fill="#ea580c" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                  />
                  <Bar 
                    dataKey="scans" 
                    name="Total Scan"
                    fill="#60a5fa" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Status Ketersediaan Stok</CardTitle>
            <CardDescription className="text-xs">
              Monitor sisa item vs ambang batas aman.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-2">
              {stockItems.slice(0, 5).map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-stone-700">{item.name}</span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded",
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

        <Card className="md:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Produktivitas Layanan per Zona</CardTitle>
            <CardDescription className="text-xs">
              Distribusi nilai transaksi berdasarkan area fisik restoran.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zonePerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#44403c', fontSize: 11, fontWeight: 700}}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#fafaf9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#1c1917" 
                    radius={[6, 6, 0, 0]} 
                    barSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {zonePerformance.map((zone, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[10px] text-stone-400 font-bold uppercase">{zone.name}</p>
                  <p className="text-xs font-black text-stone-900">Rp {zone.value >= 1000000 ? `${(zone.value/1000000).toFixed(1)}jt` : zone.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
