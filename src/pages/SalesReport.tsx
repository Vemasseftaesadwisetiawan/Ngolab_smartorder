import React, { useState, useMemo } from 'react';
import { 
  Printer,
  TrendingUp,
  ArrowUpRight,
  FileText,
  DollarSign,
  ShoppingBag,
  Target,
  Clock,
  ChevronRight,
  Calendar as CalendarIcon,
  CreditCard,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const categoryData = [
  { name: 'Bakso', value: 65, color: '#ea580c' },
  { name: 'Mie Ayam', value: 20, color: '#f97316' },
  { name: 'Minuman', value: 10, color: '#fb923c' },
  { name: 'Lainnya', value: 5, color: '#fdba74' },
];

const hourlyData = [
  { hour: '10:00', orders: 5 },
  { hour: '11:00', orders: 12 },
  { hour: '12:00', orders: 45 },
  { hour: '13:00', orders: 38 },
  { hour: '14:00', orders: 15 },
  { hour: '15:00', orders: 10 },
  { hour: '16:00', orders: 18 },
  { hour: '17:00', orders: 25 },
  { hour: '18:00', orders: 48 },
  { hour: '19:00', orders: 52 },
  { hour: '20:00', orders: 30 },
  { hour: '21:00', orders: 12 },
];

const bestSellers = [
  { name: 'Bakso Malang Spesial', sold: 452, revenue: 11300000, trend: '+12%' },
  { name: 'Mie Yamin Komplit', sold: 312, revenue: 7800000, trend: '+5%' },
  { name: 'Bakso Urat Jumbo', sold: 245, revenue: 6125000, trend: '-2%' },
  { name: 'Es Teh Manis', sold: 580, revenue: 2900000, trend: '+18%' },
  { name: 'Pangsit Goreng', sold: 198, revenue: 1980000, trend: '+8%' },
];

const monthlySales = [
  { month: 'Jan', sales: 45000000 },
  { month: 'Feb', sales: 52000000 },
  { month: 'Mar', sales: 48000000 },
  { month: 'Apr', sales: 61000000 },
];

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table: string;
  time: string;
  date?: string;
  items: OrderItem[];
  total: number;
  status: string;
  type?: string;
  paymentMethod?: string;
}

interface SalesReportProps {
  orders: Order[];
}

export function SalesReport({ orders }: SalesReportProps) {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('month');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handlePrintReport = () => {
    window.print();
  };

  // Helper to parse date string "DD/MM/YYYY" or "DD MMM YYYY"
  const parseDate = (dateStr?: string) => {
    if (!dateStr) return new Date();
    // Try DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    // Fallback or other formats could be added here
    return new Date();
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    const todayStr = now.toLocaleDateString('id-ID');
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('id-ID');

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter(order => {
      const orderDateStr = order.date || todayStr;
      const orderDate = parseDate(orderDateStr);

      if (dateRange === 'today') return orderDateStr === todayStr;
      if (dateRange === 'yesterday') return orderDateStr === yesterdayStr;
      if (dateRange === 'week') return orderDate >= weekAgo;
      if (dateRange === 'month') return orderDate >= monthStart;
      if (dateRange === 'custom') {
        const selected = new Date(customDate);
        selected.setHours(0,0,0,0);
        const selectedStr = selected.toLocaleDateString('id-ID');
        return orderDateStr === selectedStr;
      }
      return true;
    });
  }, [orders, dateRange, customDate]);

  const today = new Date().toLocaleDateString('id-ID');
  const todayOrders = useMemo(() => orders.filter(o => (o.date || today) === today), [orders, today]);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const filteredRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const derivedBestSellers = useMemo(() => {
    const counts: Record<string, { sold: number, revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!counts[item.name]) counts[item.name] = { sold: 0, revenue: 0 };
        counts[item.name].sold += item.quantity;
        counts[item.name].revenue += item.quantity * item.price;
      });
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data, trend: '+0%' }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [filteredOrders]);

  const derivedCategoryData = useMemo(() => {
    const categories: Record<string, number> = { 'Bakso': 0, 'Mie Ayam': 0, 'Minuman': 0, 'Lainnya': 0 };
    let totalItems = 0;

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        totalItems += item.quantity;
        const name = item.name.toLowerCase();
        if (name.includes('bakso')) categories['Bakso'] += item.quantity;
        else if (name.includes('mie')) categories['Mie Ayam'] += item.quantity;
        else if (name.includes('minum') || name.includes('es') || name.includes('teh')) categories['Minuman'] += item.quantity;
        else categories['Lainnya'] += item.quantity;
      });
    });

    const colors: Record<string, string> = { 'Bakso': '#ea580c', 'Mie Ayam': '#f97316', 'Minuman': '#fb923c', 'Lainnya': '#fdba74' };

    if (totalItems === 0) return [];

    return Object.entries(categories)
      .map(([name, value]) => ({ 
        name, 
        value: Math.round((value / totalItems) * 100), 
        color: colors[name] 
      }))
      .filter(c => c.value > 0);
  }, [filteredOrders]);

  const dateRangeLabels = {
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    week: '7 Hari Terakhir',
    month: 'Bulan Ini',
    all: 'Semua Waktu',
    custom: `Tanggal ${new Date(customDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
  };

  return (
    <div className="space-y-6">
      {/* Dashboard View (Hidden on print) */}
      <div className="space-y-6 print:hidden">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Laporan Penjualan</h2>
            <p className="text-xs text-neutral-500">Analisis performa bisnis periode {dateRangeLabels[dateRange]}</p>
          </div>
          <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
            {dateRange === 'custom' && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase ml-1">Pilih Tanggal</span>
                <input 
                  type="date" 
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-9 px-3 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            )}
            
            <div className="flex items-center bg-stone-100 p-1 rounded-lg">
              <Button 
                variant={dateRange === 'today' ? 'secondary' : 'ghost'} 
                size="sm"
                className={cn("text-[10px] h-7 px-2", dateRange === 'today' && "bg-white shadow-sm")}
                onClick={() => setDateRange('today')}
              >
                Hari Ini
              </Button>
              <Button 
                variant={dateRange === 'week' ? 'secondary' : 'ghost'} 
                size="sm"
                className={cn("text-[10px] h-7 px-2", dateRange === 'week' && "bg-white shadow-sm")}
                onClick={() => setDateRange('week')}
              >
                7 Hari
              </Button>
              <Button 
                variant={dateRange === 'month' ? 'secondary' : 'ghost'} 
                size="sm"
                className={cn("text-[10px] h-7 px-2", dateRange === 'month' && "bg-white shadow-sm")}
                onClick={() => setDateRange('month')}
              >
                Bulan Ini
              </Button>
              <Button 
                variant={dateRange === 'custom' ? 'secondary' : 'ghost'} 
                size="sm"
                className={cn("text-[10px] h-7 px-2", dateRange === 'custom' && "bg-white shadow-sm")}
                onClick={() => setDateRange('custom')}
              >
                Pilih Tanggal
              </Button>
              <Button 
                variant={dateRange === 'all' ? 'secondary' : 'ghost'} 
                size="sm"
                className={cn("text-[10px] h-7 px-2", dateRange === 'all' && "bg-white shadow-sm")}
                onClick={() => setDateRange('all')}
              >
                Semua
              </Button>
            </div>
            <Button className="gap-2 bg-stone-900 hover:bg-stone-800 h-9" onClick={handlePrintReport}>
              <Printer size={18} />
              Cetak
            </Button>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mb-6">
          <Card className="border border-neutral-200 bg-white">
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-neutral-100 rounded-md">
                  <Clock className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-neutral-500">Penjualan Hari Ini</p>
                  <h3 className="text-xl font-bold text-neutral-900">Rp {(todayRevenue || 0).toLocaleString()}</h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{todayOrders.length} pesanan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 bg-white">
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-neutral-100 rounded-md">
                  <DollarSign className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-neutral-500">Pendapatan Periode Ini</p>
                  <h3 className="text-xl font-bold text-neutral-900">Rp {(filteredRevenue || 0).toLocaleString()}</h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Total: Rp {(totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPI Cards */}
        <div className="grid gap-3 md:grid-cols-3 mb-6">
          <Card className="border border-neutral-200 bg-white">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-md">
                  <ShoppingBag className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-500">Pesanan Terpilih</p>
                  <h3 className="text-lg font-bold text-neutral-900">{(filteredOrders.length || 0).toLocaleString()}</h3>
                  <p className="text-[10px] text-neutral-500">Dari total {orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 bg-white">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-md">
                  <Target className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-500">Rata-rata Transaksi</p>
                  <h3 className="text-lg font-bold text-neutral-900">
                    Rp {filteredOrders.length > 0 ? Math.round(filteredRevenue / filteredOrders.length).toLocaleString() : '0'}
                  </h3>
                  <p className="text-[10px] text-neutral-500">Periode {dateRangeLabels[dateRange]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 bg-white">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-md">
                  <Users className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-500">Pelanggan Baru</p>
                  <h3 className="text-lg font-bold text-neutral-900">420</h3>
                  <p className="text-[10px] text-neutral-500">35% retensi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Chart */}
          <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tren Penjualan Bulanan</CardTitle>
                <CardDescription>Visualisasi pertumbuhan pendapatan sepanjang 2024</CardDescription>
              </div>
              <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50">
                Positif +15%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySales}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => `Rp ${value/1000000}jt`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                      formatter={(value: number) => [`Rp ${(value || 0).toLocaleString()}`, 'Penjualan']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#ea580c" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours Chart */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={18} className="text-orange-600" />
                Jam Sibuk
              </CardTitle>
              <CardDescription>Rata-rata pesanan per jam operasional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} fontSize={10} interval={1} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <Tooltip 
                      cursor={{fill: '#f5f5f4'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-[11px] text-blue-700 leading-relaxed italic">
                Insight: Penjualan tertinggi terjadi pada jam makan siang dan makan malam.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Best Sellers */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Menu Terlaris</CardTitle>
              <CardDescription>Produk dengan volume penjualan tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {derivedBestSellers.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 hover:border-orange-200 transition-colors cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 text-xs font-bold font-mono">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{item.name}</p>
                        <p className="text-[10px] text-stone-500">{item.sold} pcs terjual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-900">Rp {(item.revenue || 0).toLocaleString()}</p>
                      <span className={cn(
                        "text-[10px] font-medium text-stone-400"
                      )}>
                        {filteredRevenue > 0 ? Math.round((item.revenue / filteredRevenue) * 100) : 0}% Kontribusi
                      </span>
                    </div>
                  </div>
                ))}
                {derivedBestSellers.length === 0 && (
                  <div className="text-center py-10 text-stone-400 text-xs italic">
                    Tidak ada data penjualan untuk periode ini.
                  </div>
                )}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-2">
                Lihat Detail <ChevronRight size={16} />
              </Button>
            </CardContent>
          </Card>

          {/* Categories Distribution */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Distribusi Kategori</CardTitle>
              <CardDescription>Persentase kontribusi per kategori menu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={derivedCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {derivedCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {derivedCategoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg border border-stone-50">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-xs font-medium text-stone-600">{item.name}</p>
                      <p className="text-sm font-bold text-stone-900">{item.value}%</p>
                    </div>
                  </div>
                ))}
                {derivedCategoryData.length === 0 && (
                  <div className="col-span-2 text-center text-stone-400 text-[10px] italic py-8">
                    Data kategori tidak tersedia untuk periode ini.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ringkasan Transaksi Terakhir</CardTitle>
              <CardDescription>Update aktifitas penjualan secara real-time</CardDescription>
            </div>
            <Button variant="outline" className="gap-2 border-stone-200">
              <FileText size={18} />
              Ekspor Laporan
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-stone-100">
                  <TableHead className="pl-6">ID Transaksi</TableHead>
                  <TableHead>Meja</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Tipe Pesanan</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.slice(0, 10).map((order) => (
                  <TableRow key={order.id} className="border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-stone-500">
                      #{order.id}
                    </TableCell>
                    <TableCell className="text-stone-700 font-medium">{order.table || 'Walk-in'}</TableCell>
                    <TableCell className="text-stone-500 text-xs">{order.date || today}, {order.time}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "font-bold text-[10px] border-stone-200",
                        order.type === 'POS' ? "text-blue-600 bg-blue-50 border-blue-200" : "text-orange-600 bg-orange-50 border-orange-200"
                      )}>
                        {order.type || 'ngolab'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-stone-400" />
                        <span className="text-stone-600">{order.paymentMethod || 'Tunai'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-stone-900">
                      Rp {(order.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge className={cn(
                        "hover:bg-opacity-100 border-none px-2 py-0.5 text-[10px]",
                        order.status === 'Selesai' || order.status === 'Siap Disajikan' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-stone-400">
                      Belum ada transaksi pada periode ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Printable Report View (Only visible during print) */}
      <div className="hidden print:block font-sans text-stone-900 bg-white max-w-4xl mx-auto p-4 leading-relaxed">
        {/* Header */}
        <div className="text-center border-b-2 border-stone-900 pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase tracking-wider">Laporan Penjualan Harian</h1>
          <h2 className="text-base font-bold text-stone-600 mt-1">ngolab</h2>
          <p className="text-[10px] text-stone-400 mt-1">Smart Order System • F&B Platform</p>
        </div>

        {/* Report Metadata */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs text-stone-800">
          <div className="space-y-1">
            <p><strong>Periode Laporan:</strong> {dateRangeLabels[dateRange]}</p>
            {dateRange === 'custom' && <p><strong>Tanggal Kustom:</strong> {new Date(customDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            <p><strong>Total Transaksi:</strong> {filteredOrders.length} Pesanan Sukses</p>
          </div>
          <div className="text-right space-y-1">
            <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            <p><strong>Petugas / Operator:</strong> Admin Yanto</p>
          </div>
        </div>

        {/* KPI Summaries */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-stone-300 rounded-lg p-3 bg-stone-50">
            <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Pendapatan Periode Ini</p>
            <p className="text-base font-bold text-stone-900 mt-1">Rp {filteredRevenue.toLocaleString()}</p>
          </div>
          <div className="border border-stone-300 rounded-lg p-3 bg-stone-50">
            <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Rata-rata Transaksi</p>
            <p className="text-base font-bold text-stone-900 mt-1">
              Rp {filteredOrders.length > 0 ? Math.round(filteredRevenue / filteredOrders.length).toLocaleString() : '0'}
            </p>
          </div>
          <div className="border border-stone-300 rounded-lg p-3 bg-stone-50">
            <p className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Pendapatan Hari Ini</p>
            <p className="text-base font-bold text-stone-900 mt-1">Rp {todayRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Best Selling Items Table */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-stone-950 uppercase tracking-widest border-b border-stone-800 pb-1 mb-3">
            1. Daftar Menu Terlaris (Volume Terbanyak)
          </h3>
          <table className="w-full text-[11px] text-left border-collapse border border-stone-200">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-stone-800">
                <th className="py-1.5 px-3 font-bold w-12 border-r border-stone-200">No</th>
                <th className="py-1.5 px-3 font-bold border-r border-stone-200">Nama Menu</th>
                <th className="py-1.5 px-3 font-bold text-right border-r border-stone-200">Jumlah Terjual</th>
                <th className="py-1.5 px-3 font-bold text-right">Total Kontribusi</th>
              </tr>
            </thead>
            <tbody>
              {derivedBestSellers.map((item, idx) => (
                <tr key={idx} className="border-b border-stone-200 hover:bg-stone-50">
                  <td className="py-1.5 px-3 font-mono border-r border-stone-200">{idx + 1}</td>
                  <td className="py-1.5 px-3 font-semibold border-r border-stone-200">{item.name}</td>
                  <td className="py-1.5 px-3 text-right border-r border-stone-200">{item.sold} porsi</td>
                  <td className="py-1.5 px-3 text-right font-bold">Rp {item.revenue.toLocaleString()}</td>
                </tr>
              ))}
              {derivedBestSellers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-stone-400 italic">Tidak ada data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Transaction History Log */}
        <div>
          <h3 className="text-xs font-bold text-stone-950 uppercase tracking-widest border-b border-stone-800 pb-1 mb-3">
            2. Log Rincian Transaksi
          </h3>
          <table className="w-full text-[10px] text-left border-collapse border border-stone-200">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-stone-800">
                <th className="py-1.5 px-2 font-bold border-r border-stone-200">ID Transaksi</th>
                <th className="py-1.5 px-2 font-bold border-r border-stone-200">Meja</th>
                <th className="py-1.5 px-2 font-bold border-r border-stone-200">Tanggal/Waktu</th>
                <th className="py-1.5 px-2 font-bold border-r border-stone-200">Metode Bayar</th>
                <th className="py-1.5 px-2 font-bold border-r border-stone-200">Status</th>
                <th className="py-1.5 px-2 font-bold text-right">Total Belanja</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-stone-200">
                  <td className="py-1.5 px-2 font-mono border-r border-stone-200">#{order.id}</td>
                  <td className="py-1.5 px-2 font-medium border-r border-stone-200">{order.table || 'Walk-in'}</td>
                  <td className="py-1.5 px-2 text-stone-600 border-r border-stone-200">{order.date || today}, {order.time}</td>
                  <td className="py-1.5 px-2 border-r border-stone-200">{order.paymentMethod || 'Tunai'}</td>
                  <td className="py-1.5 px-2 font-semibold text-green-700 border-r border-stone-200">{order.status}</td>
                  <td className="py-1.5 px-2 text-right font-bold">Rp {order.total.toLocaleString()}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-stone-400 italic">Belum ada transaksi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body { 
            background: white !important; 
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
