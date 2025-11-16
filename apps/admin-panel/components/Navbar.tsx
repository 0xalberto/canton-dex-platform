'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const user = AuthService.getUser();

  const handleLogout = () => {
    AuthService.logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">C</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              CantonDEX Admin
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <div className="flex items-center gap-2 border-l pl-2">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">{user?.username || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.role || 'ADMIN'}</p>
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
