import React, { useState } from 'react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  MoreVertical, 
  UserPlus, 
  Clock, 
  ShieldCheck, 
  User,
  ChevronRight,
  Filter,
  Printer,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type StaffRole = 'Operasional' | 'Support' | 'Koki' | 'Kasir';

interface StaffMember {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'Aktif' | 'Cuti' | 'Non-Aktif';
}

interface Schedule {
  id: string;
  staffId: string;
  day: string; // e.g., 'Senin'
  shift: 'Pagi' | 'Sore' | 'Full' | 'Custom';
  startTime: string;
  endTime: string;
  assignedRole: StaffRole;
}

const SHIFT_DETAILS = {
  'Pagi': { label: 'Shift Pagi', hours: '08:00 - 16:00', start: '08:00', end: '16:00' },
  'Sore': { label: 'Shift Sore', hours: '14:00 - 22:00', start: '14:00', end: '22:00' },
  'Full': { label: 'Shift Full', hours: '08:00 - 22:00', start: '08:00', end: '22:00' }
};

const initialStaff: StaffMember[] = [
  { id: 'ST-001', name: 'Budi Santoso', email: 'budi@warung.com', phone: '08123456789', joinDate: '2023-01-10', status: 'Aktif' },
  { id: 'ST-002', name: 'Siti Aminah', email: 'siti@warung.com', phone: '08123456790', joinDate: '2023-02-15', status: 'Aktif' },
  { id: 'ST-003', name: 'Agus Setiawan', email: 'agus@warung.com', phone: '08123456791', joinDate: '2023-03-20', status: 'Aktif' },
  { id: 'ST-004', name: 'Dewi Lestari', email: 'dewi@warung.com', phone: '08123456792', joinDate: '2023-05-12', status: 'Aktif' },
  { id: 'ST-005', name: 'Rina Wijaya', email: 'rina@warung.com', phone: '08123456793', joinDate: '2023-06-01', status: 'Aktif' },
];

const initialSchedules: Schedule[] = [
  { id: 'SCH-001', staffId: 'ST-001', day: 'Senin', shift: 'Pagi', startTime: '08:00', endTime: '16:00', assignedRole: 'Koki' },
  { id: 'SCH-002', staffId: 'ST-002', day: 'Senin', shift: 'Pagi', startTime: '08:00', endTime: '16:00', assignedRole: 'Operasional' },
  { id: 'SCH-003', staffId: 'ST-003', day: 'Senin', shift: 'Sore', startTime: '14:00', endTime: '22:00', assignedRole: 'Support' },
  { id: 'SCH-004', staffId: 'ST-004', day: 'Senin', shift: 'Sore', startTime: '14:00', endTime: '22:00', assignedRole: 'Operasional' },
];

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const ROLES: StaffRole[] = ['Operasional', 'Support', 'Koki', 'Kasir'];

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'schedule'>('list');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    staffId: '',
    day: '',
    shift: 'Pagi' as 'Pagi' | 'Sore' | 'Full' | 'Custom',
    startTime: '08:00',
    endTime: '16:00',
    assignedRole: 'Operasional' as StaffRole
  });

  const handleExportPDF = async () => {
    const element = document.getElementById('schedule-print-area');
    if (!element) {
      toast.error("Area jadwal tidak ditemukan");
      return;
    }
    
    toast.loading("Menyiapkan PDF...", { id: 'pdf-export' });
    
    try {
      // Use html-to-image to get a high-quality data URL
      const dataUrl = await toPng(element, { 
        quality: 0.95,
        backgroundColor: '#ffffff',
        // This avoids html2canvas parsing errors by using SVG foreignObject
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Jadwal-Jaga-Mingguan-${new Date().toLocaleDateString('id-ID')}.pdf`);
      
      toast.success("PDF berhasil diunduh!", { id: 'pdf-export' });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengekspor PDF. Silakan gunakan fitur Cetak browser.", { id: 'pdf-export' });
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule: Schedule = {
      id: `SCH-${Math.random().toString(36).substr(2, 9)}`,
      ...scheduleForm
    };
    setSchedules(prev => [...prev, newSchedule]);
    setIsAddScheduleOpen(false);
    toast.success("Jadwal baru berhasil ditambahkan!");
  };

  const updateScheduleTime = (shift: string) => {
    if (shift !== 'Custom') {
      const details = SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS];
      setScheduleForm(prev => ({
        ...prev,
        shift: shift as any,
        startTime: details.start,
        endTime: details.end
      }));
    } else {
      setScheduleForm(prev => ({ ...prev, shift: 'Custom' }));
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMember: StaffMember = {
      id: `ST-${String(staff.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Aktif',
    };
    setStaff(prev => [...prev, newMember]);
    setIsAddStaffOpen(false);
    toast.success("Staff baru berhasil ditambahkan!");
  };

  const getStaffName = (id?: string) => staff.find(s => s.id === id)?.name || '-';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Manajemen Staff</h2>
          <p className="text-stone-500">Kelola tim, peran, dan jadwal kerja operasional</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-stone-100 p-1 rounded-lg flex items-center">
            <Button 
              variant={activeTab === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="text-xs"
              onClick={() => setActiveTab('list')}
            >
              Daftar Staff
            </Button>
            <Button 
              variant={activeTab === 'schedule' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="text-xs"
              onClick={() => setActiveTab('schedule')}
            >
              Jadwal Jaga
            </Button>
          </div>
          <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
            <DialogTrigger 
              render={
                <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <UserPlus size={18} />
                  Tambah Staff
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddStaff}>
                <DialogHeader>
                  <DialogTitle>Tambah Staff Baru</DialogTitle>
                  <DialogDescription>
                    Lengkapi informasi staff dan tentukan peran mereka.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" name="name" placeholder="Contoh: Andi Wijaya" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="andi@warung.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input id="phone" name="phone" placeholder="0812..." required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddStaffOpen(false)}>Batal</Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Staff</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <Input 
                placeholder="Cari nama staff atau peran..." 
                className="pl-10 bg-white border-stone-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 border-stone-200">
              <Filter size={18} />
              Filter Peran
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStaff.map((member) => (
              <Card key={member.id} className="border-none shadow-sm bg-white overflow-hidden group hover:ring-1 hover:ring-orange-200 transition-all">
                <CardContent className="p-0">
                  <div className="p-5 flex flex-col items-center text-center border-b border-stone-50">
                    <Avatar className="w-16 h-16 mb-4 border-2 border-stone-100">
                      <AvatarFallback className="bg-stone-100 text-stone-500 font-bold uppercase">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-stone-900">{member.name}</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 flex items-center gap-1">
                        <CalendarIcon size={12} />
                        Bergabung
                      </span>
                      <span className="font-medium text-stone-700">{member.joinDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 flex items-center gap-1">
                        <User size={12} />
                        Status
                      </span>
                      <span className={cn(
                        "font-bold",
                        member.status === 'Aktif' ? "text-green-600" : "text-stone-400"
                      )}>{member.status}</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-[10px] uppercase font-bold text-stone-500 border-stone-200">
                      Profil
                    </Button>
                    <Button variant="outline" size="sm" className="w-10 border-stone-200">
                      <MoreVertical size={14} className="text-stone-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-orange-600 text-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-orange-100 text-xs uppercase font-bold tracking-wider">Shift Berjalan</p>
                  <h4 className="text-xl font-bold">Shift Pagi</h4>
                  <p className="text-orange-100 text-[10px]">Lantai 1 & 2 Aktif</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-stone-100 p-3 rounded-xl text-stone-600">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-stone-400 text-xs uppercase font-bold tracking-wider">Staff Bertugas</p>
                  <h4 className="text-xl font-bold text-stone-900">{schedules.filter(s => s.day === 'Senin' && s.shift === 'Pagi').length} Orang</h4>
                  <p className="text-stone-400 text-[10px]">Total 4 Staff hari ini</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="schedule-print-area" className="grid gap-6">
            <div className="hidden print:block mb-8">
              <h1 className="text-2xl font-bold text-stone-900">JADWAL JAGA MINGGUAN</h1>
              <p className="text-stone-500">Periode: Minggu Ke-4 - April 2026</p>
              <div className="h-px bg-stone-200 w-full my-4" />
            </div>
            {DAYS.map((day) => (
              <Card key={day} className="border-none shadow-sm bg-white overflow-hidden print:shadow-none print:border print:border-stone-100 print:mb-4">
                <div className="bg-stone-50/50 px-6 py-3 border-b border-stone-100 flex items-center justify-between print:bg-stone-100/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-stone-100 print:shadow-none">
                      <CalendarIcon size={16} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900">{day}</h3>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Jadwal Operasional</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] uppercase font-bold h-8 border-stone-200 print:hidden"
                    onClick={() => {
                      setScheduleForm({ ...scheduleForm, day, shift: 'Custom', assignedRole: 'Operasional' });
                      setIsAddScheduleOpen(true);
                    }}
                  >
                    <Plus size={14} className="mr-1" /> Tambah Shift
                  </Button>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-2 gap-3">
                    {schedules
                      .filter(s => s.day === day)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(s => {
                        const staffMember = staff.find(sm => sm.id === s.staffId);
                        return (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-stone-50/50 rounded-xl group border border-stone-100/50 hover:border-orange-200 hover:bg-white transition-all print:bg-white print:border-stone-100">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 border border-white shadow-sm print:shadow-none">
                                <AvatarFallback className="text-[10px] bg-white text-stone-500 font-bold">
                                  {staffMember?.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-bold text-stone-800">{staffMember?.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge className={cn(
                                    "text-[8px] h-4 px-1 border-none uppercase",
                                    s.assignedRole === 'Koki' ? "bg-blue-100 text-blue-600" :
                                    s.assignedRole === 'Kasir' ? "bg-emerald-100 text-emerald-600" :
                                    s.assignedRole === 'Operasional' ? "bg-orange-100 text-orange-600" :
                                    "bg-stone-100 text-stone-600"
                                  )}>
                                    {s.assignedRole}
                                  </Badge>
                                  <span className="text-[9px] text-stone-400 font-mono italic">{s.startTime} - {s.endTime}</span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                              <MoreVertical size={14} />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  {schedules.filter(s => s.day === day).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <Clock size={24} className="text-stone-300 mb-2" />
                      <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Belum ada staff</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'schedule' && (
        <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddSchedule}>
              <DialogHeader>
                <DialogTitle>Atur Jadwal Jaga</DialogTitle>
                <DialogDescription>
                  Tentukan staff dan jam kerja untuk hari {scheduleForm.day}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Pilih Staff</Label>
                  <Select 
                    value={scheduleForm.staffId} 
                    onValueChange={(v) => setScheduleForm(prev => ({ ...prev, staffId: v }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih staff..." />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Peran Tugas</Label>
                  <Select 
                    value={scheduleForm.assignedRole} 
                    onValueChange={(v) => setScheduleForm(prev => ({ ...prev, assignedRole: v as StaffRole }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih peran..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Jam Mulai</Label>
                    <Input 
                      id="startTime" 
                      type="time" 
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value, shift: 'Custom' }))}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">Jam Selesai</Label>
                    <Input 
                      id="endTime" 
                      type="time" 
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value, shift: 'Custom' }))}
                      required 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddScheduleOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Jadwal</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
