'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  CalendarClock,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Shield,
  Briefcase,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth, useDoc } from '@/supabase';
import { User } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Upcoming Events' },
  { href: '/dashboard/my-events', icon: CalendarCheck, label: 'My Events' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/dashboard/past-events', icon: CalendarClock, label: 'Past Events' },
  { href: '/dashboard/manage-events', icon: Briefcase, label: 'Manage Events', organizerOnly: true },
  { href: '/dashboard/admin', icon: Shield, label: 'Admin Dashboard', adminOnly: true },
];


function NavLink({ item }: { item: (typeof navItems)[0] }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');


  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
        isActive && 'bg-muted text-primary'
      )}
    >
      <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
      <span className={cn('font-medium', { 'text-primary': isActive })}>{item.label}</span>
    </Link>
  );
}

function CommonSidebar({ isMobile = false }) {
    const { user, isUserLoading } = useAuth();

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>('users', user?.id, 'id,first_name,last_name,email,role,avatar');
    
    const isLoading = isUserLoading || isProfileLoading;
    
    const renderNavItems = () => {
        if (isLoading) {
            return (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            );
        }

        const isOrganizer = userProfile?.role === 'club_organizer';
        const isAdmin = userProfile?.role === 'admin';

        return navItems.map(item => {
            if (item.organizerOnly && !isOrganizer && !isAdmin) return null;
            if (item.adminOnly && !isAdmin) return null;

            return <NavLink key={item.href} item={item} />
        });
    }

    const isOrganizer = !isLoading && userProfile?.role === 'club_organizer';
    const isAdmin = !isLoading && userProfile?.role === 'admin';

    return (
        <div className={cn("flex h-full max-h-screen flex-col", isMobile ? "w-full" : "")}>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold font-headline">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className={cn({ 'hidden': !isMobile, 'block': isMobile })}>Campus Hub</span>
            </Link>
        </div>
        <div className="flex-1 overflow-auto">
            <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4 py-4", { "px-4": isMobile })}>
                {renderNavItems()}
            </nav>
        </div>
        <div className="mt-auto p-4 border-t">
            {(isOrganizer || isAdmin) && (
            <div className="pb-4">
                <Link href="/dashboard/create-event">
                <Button size="sm" className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Event
                </Button>
                </Link>
            </div>
            )}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/profile" className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                    {userProfile?.avatar && <AvatarImage src={userProfile.avatar} alt={`${userProfile.first_name} ${userProfile.last_name}`} />}
                    <AvatarFallback>{userProfile?.first_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-sm truncate">{userProfile ? `${userProfile.first_name} ${userProfile.last_name}`: 'User'}</span>
                        <span className="text-xs text-muted-foreground capitalize truncate">{(userProfile?.role || '').replace('_', ' ')}</span>
                    </div>
                </Link>
                <Link href="/dashboard/settings" className="ml-auto flex-shrink-0">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <Settings className="h-4 w-4" />
                </Button>
                </Link>
            </div>
        </div>
        </div>
    );
}


export default function AppSidebar({ isMobile = false }: { isMobile?: boolean }) {
  if (isMobile) {
    return <CommonSidebar isMobile={true} />;
  }

  return (
    <aside className="hidden border-r bg-card md:block">
        <CommonSidebar isMobile={false} />
    </aside>
  );
}
