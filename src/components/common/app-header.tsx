'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Calendar,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AppSidebar from './app-sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth, useDoc } from '@/supabase';
import { signOut } from '@/supabase/auth';
import type { User } from '@/lib/types';
import { useState } from 'react';
import NotificationsPanel from '@/components/notifications-panel';
import { useCollection } from '@/supabase';
import type { Notification } from '@/lib/notification-service';
import { useToast } from '@/hooks/use-toast';

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { toast } = useToast();

  const { data: userProfile } = useDoc<User>('users', user?.id, '*');

  const { data: notifications } = useCollection<Notification>('notifications', {
    filters: { userId: user?.id },
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const pageTitle =
    pathname
      .split('/')
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard';
      
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Logout failed. Please try again.",
      });
    }
  };

  const Breadcrumb = () => (
    <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
      <Link href="/dashboard" className="hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      <span>/</span>
      <span>{pageTitle === "Dashboard" ? "Upcoming Events" : pageTitle}</span>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs p-0 w-full">
            <AppSidebar isMobile={true} />
          </SheetContent>
        </Sheet>

        <Breadcrumb />

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  {userProfile?.avatar && <AvatarImage src={userProfile.avatar} alt={`${userProfile.first_name} ${userProfile.last_name}`} />}
                  <AvatarFallback>{userProfile?.first_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>{userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'User'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                      </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
