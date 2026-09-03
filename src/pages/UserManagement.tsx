import React, { useState } from 'react';
import { Plus, Search, Shield, ShieldCheck, ShieldAlert, MoreVertical, Mail, Calendar, Filter, Edit2, Trash2, Power } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { apiFetch } from '@/lib/apiFetch';

const roleIcons: Record<string, any> = {
  'Admin': ShieldCheck,
  'Kasir': Shield,
  'Koki': ShieldAlert,
  'User': Shield,
};

const roleColors: Record<string, string> = {
  'Admin': 'text-purple-600 bg-purple-50 border-purple-200',
  'Kasir': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Koki': 'text-blue-600 bg-blue-50 border-blue-200',
  'User': 'text-stone-600 bg-stone-50 border-stone-200',
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form States
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('Kasir');
  const [addPassword, setAddPassword] = useState('');

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('Kasir');
  const [editStatus, setEditStatus] = useState('Aktif');
  const [editPassword, setEditPassword] = useState('');

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  const effectiveSearchTerm = searchTerm || localSearchTerm;

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ name: addName, emailNim: addEmail, password: addPassword, role: addRole }),
      });
      const data = await res.json();
      if (data.success) {
        const newUser: User = {
          id: String(data.userId || Math.random()),
          name: addName,
          email: addEmail,
          role: addRole,
          status: 'Active',
          joined: new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        };
        setUsers((prev: any) => [...prev, newUser]);
        toast.success("Pengguna berhasil ditambahkan!");
        setIsAddDialogOpen(false);
        setAddName('');
        setAddEmail('');
        setAddRole('Kasir');
        setAddPassword('');
      } else {
        toast.error(data.message || "Gagal menambahkan pengguna");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server untuk menambahkan pengguna");
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status === 'Active' || user.status === 'Aktif' ? 'Aktif' : 'Non-aktif');
    setEditPassword('');
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload: any = {
        name: editName,
        email: editEmail,
        role: editRole,
        status: editStatus === 'Aktif' ? 'Active' : 'Inactive'
      };
      if (editPassword.trim()) {
        payload.password = editPassword;
      }

      const res = await apiFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev: any) => prev.map((u: any) => 
          u.id === editingUser.id ? { ...u, name: editName, email: editEmail, role: editRole, status: editStatus === 'Aktif' ? 'Active' : 'Inactive' } : u
        ));
        toast.success("Data pengguna berhasil diperbarui!");
        setIsEditDialogOpen(false);
        setEditingUser(null);
      } else {
        toast.error(data.message || "Gagal memperbarui pengguna");
      }
    } catch (err) {
      toast.error("Gagal menyimpan perubahan ke server");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const isCurrentlyActive = user.status === 'Active' || user.status === 'Aktif';
    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    const displayStatus = isCurrentlyActive ? 'Non-aktif' : 'Aktif';

    try {
      const res = await apiFetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev: any) => prev.map((u: any) => 
          u.id === user.id ? { ...u, status: newStatus } : u
        ));
        toast.success(`Status ${user.name} diubah menjadi ${displayStatus}`);
      } else {
        toast.error(data.message || "Gagal mengubah status pengguna");
      }
    } catch (err) {
      toast.error("Gagal mengubah status di server");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Anda yakin ingin menghapus pengguna ini?")) return;
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev: any) => prev.filter((user: any) => user.id !== id));
        toast.success("Pengguna berhasil dihapus");
      } else {
        toast.error(data.message || "Gagal menghapus pengguna");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server untuk menghapus pengguna");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(effectiveSearchTerm.toLowerCase());

    const isUserActive = user.status === 'Active' || user.status === 'Aktif';
    const matchesRole = roleFilter === 'Semua' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'Semua' || 
      (statusFilter === 'Aktif' && isUserActive) || 
      (statusFilter === 'Non-aktif' && !isUserActive);

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
                <DropdownMenuCheckboxItem checked={roleFilter === 'Admin'} onCheckedChange={() => setRoleFilter('Admin')}>Admin</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={roleFilter === 'Kasir'} onCheckedChange={() => setRoleFilter('Kasir')}>Kasir</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={roleFilter === 'Koki'} onCheckedChange={() => setRoleFilter('Koki')}>Koki</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={roleFilter === 'User'} onCheckedChange={() => setRoleFilter('User')}>User</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Semua'} onCheckedChange={() => setStatusFilter('Semua')}>Semua Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Aktif'} onCheckedChange={() => setStatusFilter('Aktif')}>Aktif</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'Non-aktif'} onCheckedChange={() => setStatusFilter('Non-aktif')}>Non-aktif</DropdownMenuCheckboxItem>
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
                    <Input id="user-name" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Nama lengkap staf" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user-email">Email / NIM</Label>
                    <Input id="user-email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@domain.com atau NIM" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user-password">Password Awal</Label>
                    <Input id="user-password" type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user-role">Peran / Hak Akses</Label>
                    <Select value={addRole} onValueChange={setAddRole}>
                      <SelectTrigger id="user-role">
                        <SelectValue placeholder="Pilih peran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Kasir">Kasir</SelectItem>
                        <SelectItem value="Koki">Koki</SelectItem>
                        <SelectItem value="User">User</SelectItem>
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

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead className="w-12 text-center text-[11px] font-semibold text-neutral-500">#</TableHead>
              <TableHead className="text-[11px] font-semibold text-neutral-500">Pengguna</TableHead>
              <TableHead className="text-[11px] font-semibold text-neutral-500">Email</TableHead>
              <TableHead className="text-[11px] font-semibold text-neutral-500">Peran</TableHead>
              <TableHead className="text-[11px] font-semibold text-neutral-500">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-neutral-500">Bergabung</TableHead>
              <TableHead className="w-12 text-right text-[11px] font-semibold text-neutral-500">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => {
              const RoleIcon = roleIcons[user.role] || Shield;
              const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
              const isActive = user.status === 'Active' || user.status === 'Aktif';

              return (
                <TableRow key={user.id} className="hover:bg-neutral-50/80">
                  <TableCell className="text-center text-neutral-500 text-sm">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600">
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{user.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                      <Mail size={14} className="text-neutral-400" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border",
                      roleColors[user.role] || 'text-neutral-600 bg-neutral-50 border-neutral-200'
                    )}>
                      <RoleIcon size={12} />
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-xs font-medium border-none",
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-100 text-neutral-500"
                    )}>
                      {isActive ? 'Aktif' : 'Non-aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                      <Calendar size={14} className="text-neutral-400" />
                      {user.joined}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-600">
                            <MoreVertical size={18} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuItem className="gap-2" onClick={() => openEditUser(user)}>
                            <Edit2 size={14} /> Edit Profil
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleToggleStatus(user)}>
                            <Power size={14} /> {isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 size={14} /> Hapus Pengguna
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-stone-500">
                  Tidak ada pengguna yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-stone-500">
        Menampilkan <span className="font-semibold text-stone-900">{filteredUsers.length}</span> dari <span className="font-semibold text-stone-900">{users.length}</span> pengguna
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>
                Perbarui profil dan hak akses pengguna.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-user-name">Nama Lengkap</Label>
                <Input id="edit-user-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input id="edit-user-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-user-role">Peran</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger id="edit-user-role">
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Kasir">Kasir</SelectItem>
                      <SelectItem value="Koki">Koki</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-user-status">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="edit-user-status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Non-aktif">Non-aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-user-password">Ganti Password (Opsional)</Label>
                <Input id="edit-user-password" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Kosongkan jika tidak diubah" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
              }}>Batal</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
