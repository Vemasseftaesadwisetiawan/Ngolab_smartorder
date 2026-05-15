import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (role: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Selamat datang, ${data.user.name}!`);
        onLogin(data.user.role);
      } else {
        toast.error(data.error || 'Login gagal');
      }
    } catch (error) {
      toast.error('Gagal terhubung ke server database. Pastikan server nyala.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-50 p-4 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 -mr-24 -mt-24 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 -ml-24 -mb-24 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 mb-4 rotate-3 transform hover:rotate-0 transition-transform duration-300">
            <UtensilsCrossed size={32} />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">SmartOrder F&B</h1>
          <p className="text-stone-500 font-medium">Modul Pengelola Terpusat</p>
        </div>

        <Card className="border-none shadow-xl shadow-stone-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold text-stone-900">Masuk ke Dashboard</CardTitle>
            <CardDescription className="text-stone-500 font-medium leading-relaxed">
              Gunakan email dan password yang telah didaftarkan oleh administrator.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-700 font-semibold text-xs uppercase tracking-wider">Email Bisnis</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@smartorder.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 border-stone-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-stone-700 font-semibold text-xs uppercase tracking-wider">Kata Sandi</Label>
                  <a href="#" className="text-xs text-orange-600 font-bold hover:underline">Lupa sandi?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 border-stone-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg transition-all"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-lg shadow-orange-100 transition-all group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Masuk Sekarang
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <div className="text-center">
                <p className="text-xs text-stone-400 font-medium">
                  © 2024 Ngolab System. All rights reserved.
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 grid grid-cols-3 gap-2 opacity-60">
          <div className="h-0.5 bg-stone-200 rounded-full"></div>
          <div className="h-0.5 bg-orange-200 rounded-full"></div>
          <div className="h-0.5 bg-stone-200 rounded-full"></div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-[10px] text-stone-400 uppercase font-bold tracking-[0.2em]">
            Precision Service • Smart Automation • Data Driven
          </p>
        </div>
      </div>
    </div>
  );
}
