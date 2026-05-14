import React from 'react';
import { Bell, Search, User } from 'lucide-react';
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

interface HeaderProps {
  title: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  userRole: string | null;
}

export function Header({ title, searchTerm, setSearchTerm, userRole }: HeaderProps) {
  const getUserName = () => {
    switch(userRole) {
      case 'Administrator': return 'Administrator Pusat';
      case 'Manager': return 'Mutia Operasional';
      case 'Staff': return 'Staf Dapur';
      default: return 'Admin Yanto';
    }
  };

  const getUserSub = () => {
    switch(userRole) {
      case 'Administrator': return 'Super Admin';
      case 'Manager': return 'Restoran Manager';
      case 'Staff': return 'Operator';
      default: return 'Owner';
    }
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 print:hidden">
      <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-500" />
          <Input
            type="search"
            placeholder="Cari sesuatu..."
            className="pl-9 bg-stone-50 border-stone-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative text-stone-600">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-white"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger 
            render={
              <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-stone-50">
                <Avatar className="h-8 w-8 border border-stone-200">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userRole || 'admin'}`} />
                  <AvatarFallback>{(userRole && userRole[0]) || 'AD'}</AvatarFallback>
                </Avatar>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium leading-none">{getUserName()}</p>
                  <p className="text-xs text-stone-500 mt-1">{getUserSub()}</p>
                </div>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
