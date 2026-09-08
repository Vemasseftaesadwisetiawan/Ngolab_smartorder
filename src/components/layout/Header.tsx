import React from 'react';
import { Bell, Search, User, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  title: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  userRole: string | null;
}

export function Header({ title, searchTerm, setSearchTerm, userRole }: HeaderProps) {
  const getUserName = () => {
    return userRole || 'Pengguna';
  };

  const getUserSub = () => {
    return '';
  };

  return (
    <header className="h-14 border-b bg-white/80 backdrop-blur flex items-center justify-between px-5 sticky top-0 z-50 print:hidden">
      <div className="flex items-center gap-3">
        <div className="hidden md:flex h-7 w-7 items-center justify-center rounded-md bg-orange-600 text-white">
          <Sparkles size={14} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-neutral-900 leading-tight">{title}</h1>
          <p className="text-[10px] text-neutral-500 font-medium hidden sm:block">ngolab</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <Input
            type="search"
            placeholder="Cari..."
            className="pl-8 h-8 bg-neutral-50 border-neutral-200 focus:bg-white focus:border-orange-500 transition-colors text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ThemeToggle />
        
        <Button variant="ghost" size="icon" className="relative text-neutral-600 hover:text-orange-600 hover:bg-orange-50 transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full ring-2 ring-white"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <div className="relative">
                <Avatar className="h-8 w-8 border border-neutral-200">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userRole || 'admin'}`} />
                  <AvatarFallback className="bg-neutral-100 text-neutral-700 font-bold text-xs">{(userRole && userRole[0]) || 'AD'}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium text-neutral-900 leading-none">{getUserName()}</p>
                <p className="text-[11px] text-neutral-500">{getUserSub()}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Role: {userRole || 'null'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-stone-200 shadow-lg">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-stone-900 font-bold">Akun Saya</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors">Profil</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors">Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
