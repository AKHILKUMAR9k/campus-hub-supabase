'use client';

import React, { ReactNode } from 'react';
import { SupabaseClientProvider } from '@/supabase/client-provider';

interface SupabaseWrapperProps {
  children: ReactNode;
}

export function SupabaseWrapper({ children }: SupabaseWrapperProps) {
  return (
    <SupabaseClientProvider>
      {children}
    </SupabaseClientProvider>
  );
}
