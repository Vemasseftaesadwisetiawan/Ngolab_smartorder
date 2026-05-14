import React from 'react';
import { 
  Store, 
  Bell, 
  Lock, 
  Smartphone, 
  CreditCard, 
  Globe,
  Save
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

export function Settings() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pengaturan berhasil disimpan!");
  };

  return (
    <div className="space-y-6 pb-10">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-stone-100 p-1 mb-6">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-white">
            <Store size={16} /> Umum
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-white">
            <Bell size={16} /> Notifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-white">
            <Lock size={16} /> Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Informasi Toko</CardTitle>
                <CardDescription>Atur informasi dasar mengenai outlet Bakso Mas Yanto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="outlet-name">Nama Outlet</Label>
                    <Input id="outlet-name" defaultValue="Ngolab Bakso Mas Yanto - Pusat" className="bg-stone-50 border-stone-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outlet-phone">Nomor Telepon</Label>
                    <Input id="outlet-phone" defaultValue="0812-3456-7890" className="bg-stone-50 border-stone-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="outlet-address">Alamat Lengkap</Label>
                    <Textarea id="outlet-address" defaultValue="Jl. Slamet Riyadi No. 123, Solo, Jawa Tengah" className="bg-stone-50 border-stone-200 min-h-[100px]" />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-end">
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 gap-2">
                    <Save size={18} /> Simpan Perubahan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Jam Operasional</CardTitle>
                <CardDescription>Atur waktu buka dan tutup toko.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-stone-900 font-bold">Senin - Jumat</Label>
                    <div className="flex items-center gap-3">
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold">Buka</span>
                        <Input type="time" defaultValue="10:00" className="bg-stone-50 border-stone-200" />
                      </div>
                      <span className="mt-6 text-stone-300">-</span>
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold">Tutup</span>
                        <Input type="time" defaultValue="21:00" className="bg-stone-50 border-stone-200" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-stone-900 font-bold">Sabtu - Minggu</Label>
                    <div className="flex items-center gap-3">
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold">Buka</span>
                        <Input type="time" defaultValue="09:00" className="bg-stone-50 border-stone-200" />
                      </div>
                      <span className="mt-6 text-stone-300">-</span>
                      <div className="grid gap-1.5 flex-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold">Tutup</span>
                        <Input type="time" defaultValue="22:00" className="bg-stone-50 border-stone-200" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status Toko (Online)</Label>
                    <p className="text-xs text-stone-500">Jika dimatikan, pelanggan tidak bisa memesan melalui aplikasi.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Kelola bagaimana Anda menerima pemberitahuan pesanan baru.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-stone-500 text-sm">Pengaturan notifikasi akan tersedia segera.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
