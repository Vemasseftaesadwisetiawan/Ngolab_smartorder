import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Bell, 
  Lock, 
  Smartphone, 
  CreditCard,
  Globe,
  Save,
  Moon,
  Sun,
  Monitor,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

export function Settings() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pengaturan berhasil disimpan!");
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Pengaturan</h2>
        <p className="text-xs text-neutral-500 mt-1">Kelola konfigurasi aplikasi dan preferensi sistem</p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-neutral-100 p-1 mb-4 inline-flex h-auto">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Store size={16} /> Umum
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell size={16} /> Notifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Lock size={16} /> Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border border-neutral-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store size={18} className="text-neutral-600" />
                  Informasi Toko
                </CardTitle>
                <CardDescription>Atur informasi dasar mengenai outlet ngolab.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="outlet-name">Nama Outlet</Label>
                    <Input id="outlet-name" defaultValue="ngolab - Pusat" className="bg-white border-neutral-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outlet-phone">Nomor Telepon</Label>
                    <Input id="outlet-phone" defaultValue="0812-3456-7890" className="bg-white border-neutral-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="outlet-address">Alamat Lengkap</Label>
                    <Textarea id="outlet-address" defaultValue="Jl. Slamet Riyadi No. 123, Solo, Jawa Tengah" className="bg-white border-neutral-200 min-h-[100px]" />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-end">
                  <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 gap-2">
                    <Save size={18} /> Simpan Perubahan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} className="text-neutral-600" />
                  Jam Operasional
                </CardTitle>
                <CardDescription>Atur waktu buka dan tutup toko.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-neutral-900 font-semibold">Senin - Jumat</Label>
                    <div className="flex items-center gap-3">
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Buka</span>
                        <Input type="time" defaultValue="10:00" className="bg-white border-neutral-200" />
                      </div>
                      <span className="mt-6 text-neutral-300">-</span>
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Tutup</span>
                        <Input type="time" defaultValue="21:00" className="bg-white border-neutral-200" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-neutral-900 font-semibold">Sabtu - Minggu</Label>
                    <div className="flex items-center gap-3">
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Buka</span>
                        <Input type="time" defaultValue="09:00" className="bg-white border-neutral-200" />
                      </div>
                      <span className="mt-6 text-neutral-300">-</span>
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Tutup</span>
                        <Input type="time" defaultValue="22:00" className="bg-white border-neutral-200" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-neutral-900 font-semibold">Status Toko (Online)</Label>
                    <p className="text-xs text-neutral-500">Jika dimatikan, pelanggan tidak bisa memesan melalui aplikasi.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={18} className="text-neutral-600" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>Kelola bagaimana Anda menerima pemberitahuan pesanan baru.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">Notifikasi Pesanan Baru</p>
                    <p className="text-xs text-neutral-500">Terima notifikasi saat ada pesanan masuk</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">Notifikasi Stok Kritis</p>
                    <p className="text-xs text-neutral-500">Peringatan saat stok bahan baku menipis</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">Notifikasi Rating Baru</p>
                    <p className="text-xs text-neutral-500">Pemberitahuan saat ada ulasan pelanggan</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={18} className="text-neutral-600" />
                Keamanan Akun
              </CardTitle>
              <CardDescription>Kelola password dan preferensi keamanan Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Saat Ini</Label>
                <Input id="current-password" type="password" className="bg-white border-neutral-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input id="new-password" type="password" className="bg-white border-neutral-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                <Input id="confirm-password" type="password" className="bg-white border-neutral-200" />
              </div>
              <Button className="bg-neutral-900 hover:bg-neutral-800 gap-2">
                <Save size={18} /> Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
