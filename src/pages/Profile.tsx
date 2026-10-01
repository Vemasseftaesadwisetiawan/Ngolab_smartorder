import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Shield, Calendar, Loader2, IdCard } from 'lucide-react';
import { apiFetch, getAuthToken } from '@/lib/apiFetch';

interface UserProfile {
  id: number | string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  nim?: string;
  status?: string;
  joined?: string;
}

function decodeJwtPayload(): Record<string, unknown> | null {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function Profile({ userRole }: { userRole: string | null }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      setIsLoading(true);
      // Data dasar dari JWT (id, name, email, role saat login)
      const payload = decodeJwtPayload();
      let base: UserProfile | null = null;
      if (payload && payload.id != null) {
        base = {
          id: String(payload.id),
          name: String(payload.name ?? ''),
          email: String(payload.email ?? ''),
          role: String(payload.role ?? userRole ?? 'User'),
        };
      }

      // Lengkapi dengan data server terbaru (poin, telepon, status, dll)
      const cached = localStorage.getItem('smartorder_user');
      if (cached) {
        try {
          const u = JSON.parse(cached);
          base = { ...base, ...u, id: String(u.id ?? base?.id ?? '') } as UserProfile;
        } catch { /* cache rusak, abaikan */ }
      }
      if (!cancelled) setProfile(base);

      if (base?.id) {
        try {
          const res = await apiFetch('/api/users');
          if (res.ok && !cancelled) {
            const users = await res.json();
            const me = Array.isArray(users)
              ? users.find((u: Record<string, unknown>) => String(u.id) === String(base!.id))
              : null;
            if (me) {
              setProfile(prev => prev ? {
                ...prev,
                name: me.name ?? prev.name,
                email: me.email ?? prev.email,
                role: me.role ?? prev.role,
                phone: me.phone ?? prev.phone,
                nim: me.nim ?? prev.nim,
                points: me.points ?? prev.points,
                status: me.status ?? prev.status,
                joined: me.joined ?? prev.joined,
              } : prev);
            }
          }
        } catch { /* server tidak reachable — pakai data cache/JWT */ }
      }
      if (!cancelled) setIsLoading(false);
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [userRole]);

  const roleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Admin': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Kasir': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Koki': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-stone-500">
        <User className="mx-auto mb-3 text-stone-300" size={48} />
        <p className="font-medium">Data profil tidak tersedia. Silakan logout lalu login kembali.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Kartu Profil Utama */}
      <Card className="border-neutral-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="h-24 w-24 border-2 border-orange-100">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.email || String(profile.id))}`} />
              <AvatarFallback className="bg-orange-50 text-orange-600 font-black text-2xl">
                {(profile.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="text-xl font-bold text-neutral-900">{profile.name || 'Tanpa Nama'}</h2>
                <Badge variant="outline" className={`justify-center ${roleBadgeColor(profile.role)}`}>
                  <Shield size={11} className="mr-1" />
                  {profile.role || 'User'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-stone-600">
                <span className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail size={14} className="text-stone-400" /> {profile.email || '-'}
                </span>
                <span className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone size={14} className="text-stone-400" /> {profile.phone || 'Belum ada nomor'}
                </span>
                {profile.nim && (
                  <span className="flex items-center justify-center sm:justify-start gap-2">
                    <IdCard size={14} className="text-stone-400" /> NIM: {profile.nim}
                  </span>
                )}
                {profile.joined && (
                  <span className="flex items-center justify-center sm:justify-start gap-2">
                    <Calendar size={14} className="text-stone-400" /> Bergabung: {profile.joined}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan */}
      <Card className="border-neutral-200">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Role Akses</p>
            <p className="font-bold text-neutral-900">{profile.role || 'User'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Akun */}
      <Card className="border-neutral-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informasi Akun</CardTitle>
          <CardDescription>Data akun terdaftar di sistem SmartOrder.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-stone-100">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-stone-500 font-medium">User ID</span>
              <span className="text-sm font-bold text-neutral-900 font-mono">#{profile.id}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-stone-500 font-medium">Email</span>
              <span className="text-sm font-bold text-neutral-900">{profile.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-stone-500 font-medium">Status Akun</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {profile.status === 'Inactive' ? 'Non-aktif' : 'Aktif'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
