'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/supabase';
import { Loader2 } from 'lucide-react';
import AppSidebar from '@/components/common/app-sidebar';
import AppHeader from '@/components/common/app-header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isUserLoading } = useAuth();

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AppSidebar />
        <div className="flex flex-col">
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/30 dark:bg-background">
                {children}
            </main>
        </div>
    </div>
  );
}
