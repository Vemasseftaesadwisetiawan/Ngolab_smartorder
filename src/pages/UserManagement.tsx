import React from 'react';
import { 
  Plus, 
  Search, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  MoreVertical,
  Mail,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

const users = [
  { id: '1', name: 'Mas Yanto', email: 'yanto@bakso.com', role: 'Owner', status: 'Active', joined: 'Jan 2024' },
  { id: '2', name: 'Siti Aminah', email: 'siti@bakso.com', role: 'Manager', status: 'Active', joined: 'Feb 2024' },
  { id: '3', name: 'Budi Santoso', email: 'budi@bakso.com', role: 'Staff', status: 'Active', joined: 'Mar 2024' },
  { id: '4', name: 'Agus Salim', email: 'agus@bakso.com', role: 'Staff', status: 'Inactive', joined: 'Mar 2024' },
];

const roleIcons: Record<string, any> = {
  'Owner': ShieldCheck,
  'Manager': Shield,
  'Staff': ShieldAlert,
};

const roleColors: Record<string, string> = {
  'Owner': 'text-purple-600 bg-purple-50',
  'Manager': 'text-blue-600 bg-blue-50',
  'Staff': 'text-stone-600 bg-stone-50',
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  searchTerm?: string;
}

export function UserManagement({ users, setUsers, searchTerm = '' }: UserManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [localSearchTerm, setLocalSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('Semua');
  const [statusFilter, setStatusFilter] = React.useState<string>('Semua');

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      status: 'Active',
      joined: new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
    };
    
    setUsers(prev => [...prev, newUser]);
    toast.success("Pengguna berhasil ditambahkan!");
    setIsAddDialogOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    toast.error("Pengguna berhasil dihapus");
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'Semua' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'Semua' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input 
            placeholder="Cari pengguna..." 
            className="pl-10 bg-white border-stone-200"
            value={effectiveSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className={cn("gap-2 border-stone-200", (roleFilter !== 'Semua' || statusFilter !== 'Semua') && "bg-orange-50 border-orange-200 text-orange-700")}>
                  <Filter size={18} />
                  Filter
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Peran</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={roleFilter === 'Semua'} onCheckedChange={() => setRoleFilter('Semua')}>Semua Peran</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={roleFilter === 'Owner'} onCheckedChange={() => setRoleFilter('Owner')}>Owner</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={roleFilter === 'Manager'} onCheckedChange={() => setRoleFilter('Manager')}>Manager</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={roleFilter === 'Staff'} onCheckedChange={() => setRoleFilter('Staff')}>Staff</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Semua'} onCheckedChange={() => setStatusFilter('Semua')}>Semua Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Active'} onCheckedChange={() => setStatusFilter('Active')}>Aktif</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Inactive'} onCheckedChange={() => setStatusFilter('Inactive')}>Non-aktif</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <Plus size={18} />
                  Tambah Pengguna
                </Button>
              }
            />
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveUser}>
              <DialogHeader>
                <DialogTitle>Tambah Pengguna</DialogTitle>
                <DialogDescription>
                  Daftarkan anggota tim baru untuk mengelola platform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-name">Nama Lengkap</Label>
                  <Input id="user-name" name="name" placeholder="Nama lengkap staf" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input id="user-email" name="email" type="email" placeholder="email@bakso.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-role">Peran / Hak Akses</Label>
                  <Select name="role" defaultValue="Staff">
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Pengguna</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredUsers.map((user) => {
          const RoleIcon = roleIcons[user.role] || Shield;
          return (
            <Card key={user.id} className="border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-stone-100">
                      <AvatarImage src={`https://picsum.photos/seed/${user.id}/100/100`} />
                      <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-stone-900">{user.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-stone-500 text-sm">
                        <Mail size={14} />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="text-stone-400">
                          <MoreVertical size={18} />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuGroup>
                        <DropdownMenuItem className="gap-2" onClick={() => toast.info(`Edit: ${user.name}`)}>
                          Edit Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => toast.info(`Ubah Peran: ${user.name}`)}>
                          Ubah Peran
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDeleteUser(user.id)}>
                          Hapus Pengguna
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-50">
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2">Peran</p>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      roleColors[user.role] || roleColors['Staff']
                    )}>
                      <RoleIcon size={14} />
                      {user.role}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2">Status</p>
                    <Badge className={cn(
                      "font-normal border-none",
                      user.status === 'Active' ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                    )}>
                      {user.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-400">
                  <Calendar size={14} />
                  Bergabung sejak {user.joined}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

